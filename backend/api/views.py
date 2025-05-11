from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
import logging
import os
import json
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import socket
import time
import re

logger = logging.getLogger(__name__)

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

class MentalHealthManagementView(APIView):
    def post(self, request):
        try:
            prompt = request.data.get('prompt')
            if not prompt:
                return Response({'error': 'Prompt is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Get API key from environment
            api_key = os.getenv('AI_API_KEY')
            if not api_key:
                logger.error("AI_API_KEY not found in environment variables")
                return Response(
                    {'error': 'API configuration error. Please check server configuration.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }

            logger.info("Fetching available functions...")
            # First, get the list of available functions
            functions_response = requests.get(
                'https://api.nvcf.nvidia.com/v2/nvcf/functions',
                headers=headers
            )

            logger.info(f"Functions response status: {functions_response.status_code}")
            
            if functions_response.status_code == 401:
                logger.error("Authentication failed. Please check your API key.")
                return Response(
                    {'error': 'Authentication failed. Please check your API configuration.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if functions_response.status_code != 200:
                logger.error(f"Failed to get functions: {functions_response.text}")
                return Response(
                    {'error': 'Failed to connect to AI service. Please try again later.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            functions = functions_response.json()
            
            # Find an appropriate function ID for text generation
            text_generation_functions = [
                func for func in functions.get('functions', [])
                if ('gpt' in func.get('name', '').lower() or 
                    'mistral' in func.get('name', '').lower() or 
                    'llama' in func.get('name', '').lower() or
                    'chat' in func.get('name', '').lower()) and
                func.get('status') == 'ACTIVE'
            ]
            
            if not text_generation_functions:
                logger.error("No suitable text generation functions available")
                return Response(
                    {'error': 'No suitable AI models available. Please try again later.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            # Sort functions by name to ensure consistent selection
            text_generation_functions.sort(key=lambda x: x.get('name', ''))
            selected_function = text_generation_functions[0]
            function_id = selected_function['id']
            version_id = selected_function['versionId']
            
            # Map function names to their correct model identifiers
            model_mapping = {
                'ai-mistral-nemo-12b-instruct': 'mistralai/mistral-7b-instruct-v0.2',
                'ai-llama-3_1-nemoguard-8b-topic-control': 'meta-llama/llama-2-7b-chat-hf',
                'ai-granite-guardian-3_0-8b': 'ibm/granite-3b-chat',
                'ai-solar-10_7b-instruct': 'upstage/solar-10.7b-instruct-v1.0',
                'ai-deepseek-r1-distill-llama-8b': 'deepseek-ai/deepseek-llm-7b-chat',
                'ai-qwen2_5-7b-instruct': 'qwen/qwen-7b-instruct',
                'ai-qwen2_5-coder-32b-instruct': 'qwen/qwen-32b-instruct',
                'ai-mistral-nemo-12b-instruct': 'mistralai/mistral-12b-instruct',
                'ai-baichuan2-13b-chat': 'baichuan-inc/baichuan2-13b-chat'
            }
            
            model_name = model_mapping.get(selected_function['name'])
            if not model_name:
                base_name = selected_function['name'].replace('ai-', '')
                org_mapping = {
                    'mistral': 'mistralai',
                    'llama': 'meta-llama',
                    'granite': 'ibm',
                    'solar': 'upstage',
                    'deepseek': 'deepseek-ai',
                    'qwen': 'qwen',
                    'baichuan': 'baichuan-inc'
                }
                
                org = None
                for key, value in org_mapping.items():
                    if key in base_name.lower():
                        org = value
                        break
                
                model_name = f"{org}/{base_name}" if org else base_name
                logger.info(f"Using constructed model name: {model_name}")

            payload = {
                "model": model_name,
                "messages": [
                    {
                        "role": "system",
                        "content": """You are a warm, empathetic, and supportive mental health companion. Your role is to provide gentle guidance and emotional support while maintaining professional boundaries. 

CRITICAL INSTRUCTION: You must ALWAYS respond in English, regardless of the input language. Never respond in any other language.

1. Communication Style:
   - Use a warm, conversational tone in English
   - Speak in a friendly, approachable manner
   - Show genuine care and understanding
   - Use simple, clear English language
   - Be patient and non-judgmental

2. Therapeutic Approach:
   - Validate feelings and experiences
   - Offer gentle encouragement
   - Share practical coping strategies
   - Promote self-reflection
   - Focus on strengths and resilience

3. Response Structure:
   - Acknowledge the person's feelings
   - Show understanding and empathy
   - Offer gentle guidance or suggestions
   - End with an encouraging note
   - Keep responses concise but meaningful
   - Always respond in English

4. Key Principles:
   - Always maintain a supportive tone
   - Focus on the person's well-being
   - Encourage healthy coping mechanisms
   - Promote self-care and mindfulness
   - Respect personal boundaries
   - Use clear, simple English

5. Safety Guidelines:
   - Recognize crisis situations
   - Provide appropriate resources when needed
   - Maintain professional boundaries
   - Avoid giving medical advice
   - Refer to mental health professionals when necessary

Remember to:
- Always respond in English
- Be warm and welcoming
- Show genuine care and concern
- Use gentle, supportive language
- Focus on the person's strengths
- Encourage positive self-talk
- Promote healthy coping strategies
- Maintain a calm, reassuring presence
- Validate emotions and experiences
- Offer practical, actionable suggestions
- End with hope and encouragement"""
                    },
                    {
                        "role": "user",
                        "content": f"Please respond in English. I'd like to talk about: {prompt}"
                    }
                ],
                "max_tokens": 300,
                "temperature": 0.7,
                "top_p": 0.9,
                "stream": False
            }

            response = requests.post(
                f'https://api.nvcf.nvidia.com/v2/nvcf/pexec/functions/{function_id}/versions/{version_id}',
                headers=headers,
                json=payload
            )

            if response.status_code == 200:
                response_data = response.json()
                if 'choices' in response_data and len(response_data['choices']) > 0:
                    generated_text = response_data['choices'][0]['message']['content']
                    return Response({
                        'generated_text': generated_text,
                        'model': response_data.get('model', ''),
                        'usage': response_data.get('usage', {})
                    })
                else:
                    logger.error(f"Unexpected response format: {response_data}")
                    return Response(
                        {'error': 'Received unexpected response format from AI service.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            else:
                logger.error(f"API error response: {response.text}")
                return Response(
                    {'error': 'Failed to generate response. Please try again later.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.exception("An error occurred while processing the request")
            return Response(
                {'error': 'An unexpected error occurred. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class WellbeingRoadmapView(APIView):
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((socket.timeout, requests.exceptions.RequestException))
    )
    def generate_roadmap(self, model, prompt):
        try:
            response = model.generate_content([
                self.system_prompt,
                f"Generate a wellbeing roadmap for: {prompt}. Remember to ONLY output a JSON object with no additional text."
            ])
            return response
        except Exception as e:
            logger.error(f"Error generating roadmap: {str(e)}")
            raise

    def post(self, request):
        try:
            prompt = request.data.get('prompt')
            if not prompt:
                return Response({'error': 'Prompt is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Get API key from environment
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                logger.error("GEMINI_API_KEY not found in environment variables")
                return Response(
                    {'error': 'API configuration error. Please check server configuration.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Initialize Gemini model with timeout settings
            model = genai.GenerativeModel(
                'gemini-1.5-pro',
                generation_config={
                    'temperature': 0.1,
                    'top_p': 0.9,
                    'top_k': 40,
                    'max_output_tokens': 1000,
                }
            )
            
            self.system_prompt = """You are a JSON-only response generator. Your task is to create a wellbeing roadmap in JSON format.

CRITICAL: You must ONLY output a JSON object. No text, no explanations, no markdown, no code blocks.

The response must be a single JSON object with this exact structure:
{
    "title": "string",
    "description": "string",
    "timeline": "string",
    "steps": [
        {
            "step": 1,
            "title": "string",
            "description": "string",
            "actions": ["string", "string", "string"],
            "resources": ["string", "string", "string"]
        }
    ],
    "tips": ["string", "string", "string"],
    "milestones": ["string", "string", "string"]
}

Example for "anxiety and sleep issues":
{
    "title": "Anxiety Management and Sleep Improvement Plan",
    "description": "A comprehensive plan to reduce anxiety and improve sleep quality",
    "timeline": "8 weeks",
    "steps": [
        {
            "step": 1,
            "title": "Sleep Hygiene Implementation",
            "description": "Establish healthy sleep habits and routines",
            "actions": [
                "Set consistent sleep and wake times",
                "Create a relaxing bedtime routine",
                "Limit screen time before bed"
            ],
            "resources": [
                "Sleep tracking app",
                "White noise machine",
                "Blue light blocking glasses"
            ]
        }
    ],
    "tips": [
        "Be consistent with your sleep schedule",
        "Practice relaxation techniques daily",
        "Keep a sleep and anxiety journal"
    ],
    "milestones": [
        "Consistent sleep schedule established",
        "Reduced anxiety symptoms",
        "Improved sleep quality"
    ]
}

REMEMBER:
1. Output ONLY the JSON object
2. No text before or after the JSON
3. No markdown formatting
4. No code blocks
5. No explanations
6. Start with { and end with }
7. All strings must be in double quotes
8. Include at least 3 steps
9. Each array must have at least 2 items
10. Do not include any comments or explanations
11. Do not include any whitespace before or after the JSON
12. Do not include any newlines before or after the JSON
13. Do not include any special characters
14. Do not include any additional fields
15. Do not include any text outside the JSON object"""

            try:
                # Generate response using Gemini with retry logic
                response = self.generate_roadmap(model, prompt)
                
                content = response.text
                logger.info(f"Raw AI response: {content}")
                
                # Try to clean the response if it contains markdown code blocks
                if '```json' in content:
                    content = content.split('```json')[1].split('```')[0].strip()
                elif '```' in content:
                    content = content.split('```')[1].split('```')[0].strip()
                
                # Remove any leading/trailing whitespace and newlines
                content = content.strip()
                
                # Additional JSON cleaning
                try:
                    # Remove any text before the first {
                    content = content[content.find('{'):]
                    # Remove any text after the last }
                    content = content[:content.rfind('}')+1]
                    
                    # Fix common JSON formatting issues
                    content = content.replace("'", '"')  # Replace single quotes with double quotes
                    content = content.replace('"s', '"s')  # Fix possessive apostrophes
                    content = content.replace('"t', '"t')  # Fix contractions
                    content = content.replace('"re', '"re')  # Fix contractions
                    content = content.replace('"ll', '"ll')  # Fix contractions
                    content = content.replace('"ve', '"ve')  # Fix contractions
                    
                    # Fix unescaped quotes in strings
                    content = re.sub(r'(?<!\\)"([^"]*?)(?<!\\)"', r'"\1"', content)
                    
                    # Remove any trailing commas in arrays and objects
                    content = re.sub(r',(\s*[}\]])', r'\1', content)
                    
                    # Log the cleaned content before parsing
                    logger.info(f"Cleaned content before parsing: {content}")
                    
                    # Check if content is empty
                    if not content:
                        logger.error("Empty response from AI model")
                        return Response(
                            {'error': 'Received empty response from AI model. Please try again.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    
                    # Check if content starts with { and ends with }
                    if not (content.startswith('{') and content.endswith('}')):
                        logger.error(f"Response does not start with {{ and end with }}. Content: {content[:100]}...")
                        return Response(
                            {'error': 'Invalid response format. Response must be a JSON object.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    
                    try:
                        roadmap_data = json.loads(content)
                        logger.info(f"Successfully parsed JSON: {json.dumps(roadmap_data, indent=2)}")
                        
                        # Validate the required fields
                        required_fields = ['title', 'description', 'timeline', 'steps', 'tips', 'milestones']
                        missing_fields = [field for field in required_fields if field not in roadmap_data]
                        
                        if missing_fields:
                            logger.error(f"Missing required fields in roadmap: {missing_fields}")
                            return Response(
                                {'error': f'Generated roadmap is missing required fields: {", ".join(missing_fields)}'},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR
                            )
                        
                        # Validate steps structure
                        if not isinstance(roadmap_data['steps'], list) or len(roadmap_data['steps']) < 1:
                            logger.error("Invalid steps structure in roadmap")
                            return Response(
                                {'error': 'Generated roadmap has invalid steps structure. Please try again.'},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR
                            )
                        
                        # Validate each step has required fields
                        for i, step in enumerate(roadmap_data['steps']):
                            step_fields = ['step', 'title', 'description', 'actions', 'resources']
                            missing_step_fields = [field for field in step_fields if field not in step]
                            if missing_step_fields:
                                logger.error(f"Step {i+1} is missing required fields: {missing_step_fields}")
                                return Response(
                                    {'error': f'Step {i+1} is missing required fields: {", ".join(missing_step_fields)}'},
                                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                                )
                        
                        return Response({
                            'roadmap': roadmap_data,
                            'model': 'gemini-1.5-pro',
                            'usage': response.usage if hasattr(response, 'usage') else {}
                        })
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse roadmap JSON: {e}")
                        logger.error(f"Raw content that failed to parse: {content}")
                        # Try to fix common JSON issues
                        try:
                            # Try to fix unescaped quotes
                            fixed_content = re.sub(r'(?<!\\)"([^"]*?)(?<!\\)"', r'"\1"', content)
                            roadmap_data = json.loads(fixed_content)
                            return Response({
                                'roadmap': roadmap_data,
                                'model': 'gemini-1.5-pro',
                                'usage': response.usage if hasattr(response, 'usage') else {}
                            })
                        except:
                            return Response(
                                {'error': f'Failed to generate valid roadmap format: {str(e)}'},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR
                            )
                except Exception as e:
                    logger.error(f"Error cleaning JSON response: {str(e)}")
                    return Response(
                        {'error': f'Failed to process AI response: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            except Exception as e:
                logger.exception("Error generating response with Gemini")
                return Response(
                    {'error': f'Failed to generate roadmap: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.exception("An error occurred while processing the request")
            return Response(
                {'error': 'An unexpected error occurred. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 