export interface GrammarError {
  message: string;
  category: string;
  severity: 'minor' | 'moderate' | 'major';
  suggestion: string;
}

export interface GrammarAnalysis {
  errors: GrammarError[];
  score: number;
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  feedback: string;
  wordsPerMinute?: number;
  pace?: 'slow' | 'moderate' | 'fast';
}

export const analyzeGrammar = (text: string): GrammarAnalysis => {
  const errors: GrammarError[] = [];
  
  if (!text || text.trim().length === 0) {
    return {
      errors: [],
      score: 0,
      fluencyScore: 0,
      vocabularyScore: 0,
      grammarScore: 0,
      feedback: 'No text to analyze'
    };
  }
  
  // Common grammar checks
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  // Enhanced grammar checks
  const checks = [
    {
      regex: /\bi\b/g,
      fix: 'I',
      message: 'Use capital "I" for first person pronoun',
      category: 'Capitalization',
      severity: 'minor' as const
    },
    {
      regex: /\b(their|there|they're)\b/gi,
      message: 'Verify their/there/they\'re usage',
      category: 'Homophones',
      severity: 'moderate' as const,
      suggestion: 'their=possession, there=place, they\'re=they are'
    },
    {
      regex: /\b(your|you're)\b/gi,
      message: 'Check your/you\'re usage',
      category: 'Homophones',
      severity: 'moderate' as const,
      suggestion: 'your=possession, you\'re=you are'
    },
    {
      regex: /\b(its|it's)\b/gi,
      message: 'Verify its/it\'s usage',
      category: 'Homophones',
      severity: 'moderate' as const,
      suggestion: 'its=possession, it\'s=it is'
    },
    {
      regex: /\b(then|than)\b/gi,
      message: 'Check then/than usage',
      category: 'Homophones',
      severity: 'moderate' as const,
      suggestion: 'then=time, than=comparison'
    },
    {
      regex: /\b(affect|effect)\b/gi,
      message: 'Verify affect/effect usage',
      category: 'Commonly confused',
      severity: 'moderate' as const,
      suggestion: 'affect=verb (influence), effect=noun (result)'
    },
    {
      regex: /\b(could of|should of|would of)\b/gi,
      message: 'Use "could have" instead of "could of"',
      category: 'Common mistakes',
      severity: 'major' as const,
      suggestion: 'Use "could have", "should have", "would have"'
    },
    {
      regex: /\s{2,}/g,
      message: 'Multiple spaces detected',
      category: 'Spacing',
      severity: 'minor' as const,
      suggestion: 'Use single spaces between words'
    },
    {
      regex: /[.!?]\s*[a-z]/g,
      message: 'Sentence should start with capital letter',
      category: 'Capitalization',
      severity: 'moderate' as const,
      suggestion: 'Start sentences with capital letters'
    }
  ];

  // Track unique errors to avoid duplicates
  const uniqueErrors = new Map();

  checks.forEach(check => {
    const matches = text.match(check.regex);
    if (matches && matches.length > 0) {
      const errorKey = `${check.category}-${check.message}`;
      if (!uniqueErrors.has(errorKey)) {
        uniqueErrors.set(errorKey, {
          message: check.message,
          category: check.category,
          severity: check.severity,
          suggestion: check.suggestion || `Use "${check.fix}"`
        });
      }
    }
  });

  errors.push(...uniqueErrors.values());

  // Calculate scores
  const errorPenalty = errors.reduce((sum, err) => {
    const penalties = { minor: 2, moderate: 5, major: 10 };
    return sum + penalties[err.severity];
  }, 0);

  const grammarScore = Math.max(0, 100 - errorPenalty);
  const fluencyScore = sentences.length > 2 ? 85 : 70;
  const vocabularyScore = new Set(text.toLowerCase().split(/\s+/)).size > 20 ? 80 : 65;

  return {
    errors,
    score: Math.round((grammarScore + fluencyScore + vocabularyScore) / 3),
    fluencyScore,
    vocabularyScore,
    grammarScore,
    feedback: generateGrammarFeedback(grammarScore, fluencyScore, vocabularyScore)
  };
};

const generateGrammarFeedback = (
  grammar: number, 
  fluency: number, 
  vocabulary: number
): string => {
  const feedback: string[] = [];
  
  if (grammar < 70) {
    feedback.push('Focus on grammar fundamentals');
  }
  if (fluency < 70) {
    feedback.push('Work on sentence flow and coherence');
  }
  if (vocabulary < 70) {
    feedback.push('Expand your vocabulary');
  }
  
  if (feedback.length === 0) {
    return 'Excellent communication skills! Keep it up.';
  }
  
  return feedback.join('. ') + '.';
};

export const getSpeakingPace = (text: string, durationSeconds: number): {
  wordsPerMinute: number;
  pace: 'slow' | 'moderate' | 'fast';
  feedback: string;
} => {
  const words = text.split(/\s+/).length;
  const wpm = Math.round((words / durationSeconds) * 60);
  
  let pace: 'slow' | 'moderate' | 'fast';
  let feedback: string;
  
  if (wpm < 120) {
    pace = 'slow';
    feedback = 'Consider speaking slightly faster to maintain engagement';
  } else if (wpm > 160) {
    pace = 'fast';
    feedback = 'Slow down slightly to ensure clarity';
  } else {
    pace = 'moderate';
    feedback = 'Excellent speaking pace - clear and engaging';
  }
  
  return { wordsPerMinute: wpm, pace, feedback };
};
