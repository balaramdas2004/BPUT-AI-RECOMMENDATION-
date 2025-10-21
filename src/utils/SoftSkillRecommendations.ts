export interface YouTubeRecommendation {
  title: string;
  videoId: string;
  channel: string;
  description: string;
  skillArea: string;
}

export interface SoftSkillRecommendation {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  improvementAreas: string[];
  youtubeVideos: YouTubeRecommendation[];
  practiceExercises: string[];
}

export const generateSoftSkillRecommendations = (
  analysis: any
): SoftSkillRecommendation[] => {
  const recommendations: SoftSkillRecommendation[] = [];

  // Communication Skills
  if (analysis.communication_clarity_score < 75) {
    recommendations.push({
      skill: 'Communication Skills',
      currentLevel: analysis.communication_clarity_score,
      targetLevel: 90,
      improvementAreas: [
        'Clear articulation',
        'Structured responses',
        'Active listening'
      ],
      youtubeVideos: [
        {
          title: 'Improve Your Communication Skills',
          videoId: 'R74R-KJvuXM',
          channel: 'Communication Coach',
          description: 'Master the art of clear communication',
          skillArea: 'Communication'
        },
        {
          title: 'Public Speaking Tips for Beginners',
          videoId: 'bbz2boNSeL0',
          channel: 'TEDx Talks',
          description: 'Build confidence in speaking',
          skillArea: 'Public Speaking'
        }
      ],
      practiceExercises: [
        'Record yourself answering interview questions',
        'Practice elevator pitch daily',
        'Join a public speaking group'
      ]
    });
  }

  // Confidence & Body Language
  if (analysis.confidence_score < 75) {
    recommendations.push({
      skill: 'Confidence & Body Language',
      currentLevel: analysis.confidence_score,
      targetLevel: 90,
      improvementAreas: [
        'Confident posture',
        'Eye contact',
        'Reducing nervousness'
      ],
      youtubeVideos: [
        {
          title: 'Body Language Tips for Interviews',
          videoId: 'PCRz2BZ8v5I',
          channel: 'Charisma on Command',
          description: 'Master non-verbal communication',
          skillArea: 'Body Language'
        },
        {
          title: 'Build Unshakeable Confidence',
          videoId: 'f2yNWIFJOsg',
          channel: 'Brendon Burchard',
          description: 'Develop lasting confidence',
          skillArea: 'Confidence'
        }
      ],
      practiceExercises: [
        'Power posing before interviews',
        'Mirror practice sessions',
        'Breathing exercises for calmness'
      ]
    });
  }

  // Eye Contact
  if (analysis.eye_contact_score < 75) {
    recommendations.push({
      skill: 'Eye Contact & Engagement',
      currentLevel: analysis.eye_contact_score,
      targetLevel: 90,
      improvementAreas: [
        'Maintaining eye contact',
        'Natural gaze patterns',
        'Camera awareness'
      ],
      youtubeVideos: [
        {
          title: 'Master Eye Contact in Interviews',
          videoId: 'oi-TIz_HNXM',
          channel: 'Interview Success',
          description: 'Perfect your eye contact technique',
          skillArea: 'Eye Contact'
        }
      ],
      practiceExercises: [
        'Practice with video calls',
        'Look at camera lens, not screen',
        'Use the triangle technique (eyes-nose-mouth)'
      ]
    });
  }

  // Emotional Intelligence
  if (analysis.facial_expression_score < 75) {
    recommendations.push({
      skill: 'Emotional Intelligence',
      currentLevel: analysis.facial_expression_score,
      targetLevel: 90,
      improvementAreas: [
        'Appropriate facial expressions',
        'Reading social cues',
        'Empathy development'
      ],
      youtubeVideos: [
        {
          title: 'Develop Emotional Intelligence',
          videoId: 'Y7m9eNoB3NU',
          channel: 'Improvement Pill',
          description: 'Master EQ for success',
          skillArea: 'Emotional Intelligence'
        }
      ],
      practiceExercises: [
        'Mindfulness meditation',
        'Emotion journaling',
        'Active empathy exercises'
      ]
    });
  }

  // Professional Demeanor
  if (analysis.posture_score < 75) {
    recommendations.push({
      skill: 'Professional Demeanor',
      currentLevel: analysis.posture_score,
      targetLevel: 90,
      improvementAreas: [
        'Professional posture',
        'Workplace etiquette',
        'First impressions'
      ],
      youtubeVideos: [
        {
          title: 'Professional Interview Presence',
          videoId: '2FHf7hbC4Yo',
          channel: 'Harvard Business Review',
          description: 'Create powerful first impressions',
          skillArea: 'Professionalism'
        }
      ],
      practiceExercises: [
        'Ergonomic workspace setup',
        'Posture check reminders',
        'Professional wardrobe practice'
      ]
    });
  }

  return recommendations;
};

export const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};
