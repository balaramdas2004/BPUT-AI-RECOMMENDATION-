import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, resumeFile } = await req.json();
    
    let textContent = resumeText;
    
    // If a file is provided as base64, extract text from it
    if (resumeFile && !resumeText) {
      // For now, use the filename or placeholder
      // In a real implementation, you'd use a PDF parsing library
      textContent = resumeFile; // This should be parsed properly
    }
    
    if (!textContent) {
      throw new Error('No resume text or file provided');
    }

    // Call Lovable AI to parse resume
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume parser. Extract structured information from resumes.
Return a JSON object with:
- skills: array of technical skills found
- education: array of educational qualifications
- experience: array of work/internship experiences
- projects: array of projects mentioned
- certifications: array of certifications
- achievements: notable achievements or awards

Be thorough but only extract information that's clearly stated.`
          },
          {
            role: 'user',
            content: `Parse this resume and extract ONLY real, factual information that is explicitly stated. Do not make assumptions or add fictional data.

Resume content:
${textContent}

Extract:
- Technical skills that are explicitly mentioned
- Education qualifications with actual institutions
- Real work experience or internships listed
- Projects with actual technologies used
- Certifications with real issuers
- Achievements that are stated

Be conservative - only include information that is clearly present in the resume.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "parse_resume",
            description: "Extract structured information from resume",
            parameters: {
              type: "object",
              properties: {
                skills: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      category: { type: "string", enum: ["technical", "soft", "domain"] }
                    }
                  }
                },
                education: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      degree: { type: "string" },
                      institution: { type: "string" },
                      year: { type: "string" },
                      grade: { type: "string" }
                    }
                  }
                },
                experience: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      company: { type: "string" },
                      duration: { type: "string" },
                      description: { type: "string" }
                    }
                  }
                },
                projects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      technologies: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                certifications: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      issuer: { type: "string" },
                      date: { type: "string" }
                    }
                  }
                },
                achievements: { type: "array", items: { type: "string" } }
              },
              required: ["skills", "education", "projects"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "parse_resume" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Resume parsing failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No data extracted from resume');
    }

    const parsedData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: parsedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-resume:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Resume parsing failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
