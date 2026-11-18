export interface SurveyQuestion {
  id: number;
  key: `q${number}`;
  sectionId: number;
  text: string;
  options: readonly string[];
  helperText?: string;
}

export interface SurveySection {
  id: number;
  numberLabel: string;
  title: string;
  subtitle: string;
  instruction?: string;
  questions: readonly SurveyQuestion[];
}

export interface SurveySubmissionRecord {
  submissionId: string;
  timestamp: string;
  name: string;
  consent: boolean;
  answers: Record<string, string>;
}

export interface OptionAnalytics {
  option: string;
  originalIndex: number;
  count: number;
  percentage: number;
  rank: number | null;
}

export interface QuestionAnalytics {
  id: number;
  key: string;
  sectionId: number;
  sectionTitle: string;
  text: string;
  answeredCount: number;
  skippedCount: number;
  responseRate: number;
  options: OptionAnalytics[];
  topOptions: string[];
}

export interface SectionAnalytics {
  sectionId: number;
  title: string;
  questionCount: number;
  averageCompletionRate: number;
  totalAnsweredSlots: number;
  totalPossibleSlots: number;
}

export interface SurveyAnalyticsReport {
  totalSubmissions: number;
  overallCompletionRate: number;
  latestSubmissionAt: string | null;
  sections: SectionAnalytics[];
  questions: QuestionAnalytics[];
}

export const SURVEY_METADATA = {
  title: "Women's Health Survey",
  subtitle: 'Pregnancy, Menstrual Periods, and Spine Pain in Women',
  introduction:
    "We are conducting this survey as part of our ICT project to understand women's experiences and awareness regarding menstrual health, pregnancy, and spine or back pain. Your responses will remain confidential and will be used only for educational purposes. Participation is voluntary.",
  consentStatement: 'I have read the introduction and voluntarily agree to participate.',
  thankYouMessage:
    'Thank you for participating in our survey! Your response is valuable to our ICT project.',
  totalQuestions: 21,
  totalSections: 5,
} as const;

export const SURVEY_SECTIONS: readonly SurveySection[] = [
  {
    id: 1,
    numberLabel: 'SECTION 1',
    title: 'General Information',
    subtitle: 'A little about you',
    instruction: 'All questions are optional. Please choose one option per question, or skip any you prefer not to answer.',
    questions: [
      {
        id: 1,
        key: 'q1',
        sectionId: 1,
        text: 'What is your age?',
        options: ['Under 18', '18–25', '26–35', '36–45', 'Above 45'],
      },
      {
        id: 2,
        key: 'q2',
        sectionId: 1,
        text: 'What is your marital status?',
        options: ['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'],
      },
      {
        id: 3,
        key: 'q3',
        sectionId: 1,
        text: 'Which country do you live in?',
        options: ['Pakistan', 'India', 'Other'],
      },
      {
        id: 4,
        key: 'q4',
        sectionId: 1,
        text: 'What is your occupation?',
        options: ['Student', 'Housewife', 'Working woman', 'Other'],
      },
    ],
  },
  {
    id: 2,
    numberLabel: 'SECTION 2',
    title: 'Menstrual Health',
    subtitle: 'Your menstrual experience',
    instruction: 'Select the option that best describes your experience during menstrual periods.',
    questions: [
      {
        id: 5,
        key: 'q5',
        sectionId: 2,
        text: 'Do you experience pain during menstrual periods?',
        options: ['Yes', 'No', 'Sometimes'],
      },
      {
        id: 6,
        key: 'q6',
        sectionId: 2,
        text: 'How severe is your menstrual pain?',
        options: ['Mild', 'Moderate', 'Severe', 'No pain'],
      },
      {
        id: 7,
        key: 'q7',
        sectionId: 2,
        text: 'Where do you usually experience pain during periods?',
        options: ['Lower abdomen', 'Lower back', 'Legs', 'Multiple areas', 'No pain'],
      },
      {
        id: 8,
        key: 'q8',
        sectionId: 2,
        text: 'Does period pain affect your daily activities?',
        options: ['Yes', 'No', 'Sometimes'],
      },
      {
        id: 9,
        key: 'q9',
        sectionId: 2,
        text: 'Do you experience back pain before or during menstruation?',
        options: ['Yes', 'No', 'Sometimes'],
      },
    ],
  },
  {
    id: 3,
    numberLabel: 'SECTION 3',
    title: 'Pregnancy and Back Pain',
    subtitle: 'Pregnancy and recovery',
    instruction:
      'If you have never been pregnant, select Not applicable for questions 11–13. You may leave any question blank.',
    questions: [
      {
        id: 10,
        key: 'q10',
        sectionId: 3,
        text: 'Have you ever been pregnant?',
        options: ['Yes', 'No', 'Prefer not to say'],
      },
      {
        id: 11,
        key: 'q11',
        sectionId: 3,
        text: 'Did you experience back pain during pregnancy?',
        options: ['Yes', 'No', 'Not applicable'],
      },
      {
        id: 12,
        key: 'q12',
        sectionId: 3,
        text: 'During which stage of pregnancy was back pain most noticeable?',
        options: ['First trimester', 'Second trimester', 'Third trimester', 'Not applicable'],
        helperText: 'If you had no pregnancy-related back pain, choose "Not applicable".',
      },
      {
        id: 13,
        key: 'q13',
        sectionId: 3,
        text: 'Did you experience back pain after childbirth?',
        options: ['Yes', 'No', 'Not applicable'],
      },
    ],
  },
  {
    id: 4,
    numberLabel: 'SECTION 4',
    title: 'Spine and Back Health',
    subtitle: 'Everyday back health',
    instruction: 'Please share your general experiences with posture and everyday back or spine discomfort.',
    questions: [
      {
        id: 14,
        key: 'q14',
        sectionId: 4,
        text: 'Do you frequently experience spine or back pain?',
        options: ['Yes', 'No', 'Sometimes'],
      },
      {
        id: 15,
        key: 'q15',
        sectionId: 4,
        text: 'Which area of your back experiences the most pain?',
        options: ['Upper back', 'Middle back', 'Lower back', 'Entire back', 'No pain'],
      },
      {
        id: 16,
        key: 'q16',
        sectionId: 4,
        text: 'Does sitting for long periods increase your back pain?',
        options: ['Yes', 'No', 'Sometimes'],
      },
      {
        id: 17,
        key: 'q17',
        sectionId: 4,
        text: 'Do you think poor sitting or standing posture contributes to back pain?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
  },
  {
    id: 5,
    numberLabel: 'SECTION 5',
    title: 'Awareness and Prevention',
    subtitle: 'Knowledge and support',
    instruction: 'Your final answers help us understand awareness gaps and educational needs.',
    questions: [
      {
        id: 18,
        key: 'q18',
        sectionId: 5,
        text: 'Are you aware of exercises that can help reduce back pain?',
        options: ['Yes', 'No', 'A little'],
      },
      {
        id: 19,
        key: 'q19',
        sectionId: 5,
        text: 'Have you ever consulted a doctor about menstrual or back pain?',
        options: ['Yes', 'No', 'Prefer not to say'],
      },
      {
        id: 20,
        key: 'q20',
        sectionId: 5,
        text: "Would you like to receive more awareness and information about women's menstrual, pregnancy, and spine health?",
        options: ['Yes', 'No', 'Maybe'],
      },
      {
        id: 21,
        key: 'q21',
        sectionId: 5,
        text: 'Have you ever received information or education about menstrual and reproductive health?',
        options: [
          'Yes, through school or university',
          'Yes, through doctors or healthcare professionals',
          'Yes, through the internet or social media',
          'No, I have never received such information',
        ],
        helperText: 'Select your primary source of information.',
      },
    ],
  },
] as const;

export const ALL_QUESTIONS: readonly SurveyQuestion[] = SURVEY_SECTIONS.flatMap(
  (section) => section.questions,
);

export const QUESTION_BY_ID: ReadonlyMap<number, SurveyQuestion> = new Map(
  ALL_QUESTIONS.map((q) => [q.id, q]),
);

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: {
    submissionId: string;
    name: string;
    consent: true;
    answers: Record<string, string>;
  };
}

export function validateSurveyPayload(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid submission payload.' };
  }

  const record = body as Record<string, unknown>;

  if (typeof record.website === 'string' && record.website.trim().length > 0) {
    return { valid: false, error: 'Automated submission rejected.' };
  }

  if (record.consent !== true) {
    return {
      valid: false,
      error: 'Please confirm your voluntary participation consent before submitting.',
    };
  }

  const rawId =
    typeof record.submissionId === 'string'
      ? record.submissionId.trim()
      : typeof record.id === 'string'
        ? record.id.trim()
        : '';

  if (!rawId || rawId.length < 8 || rawId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(rawId)) {
    return { valid: false, error: 'Missing or invalid submission identifier.' };
  }

  const rawName = typeof record.name === 'string' ? record.name.trim() : '';
  if (rawName.length > 100) {
    return { valid: false, error: 'Participant name must be 100 characters or fewer.' };
  }

  const rawAnswers =
    record.answers && typeof record.answers === 'object'
      ? (record.answers as Record<string, unknown>)
      : {};

  const cleanAnswers: Record<string, string> = {};

  for (const question of ALL_QUESTIONS) {
    const candidate =
      rawAnswers[String(question.id)] ??
      rawAnswers[question.key] ??
      record[question.key] ??
      '';

    if (candidate === null || candidate === undefined || candidate === '') {
      cleanAnswers[String(question.id)] = '';
      continue;
    }

    if (typeof candidate !== 'string') {
      return {
        valid: false,
        error: `Invalid answer format for Question ${question.id}.`,
      };
    }

    const trimmed = candidate.trim();
    if (trimmed === '') {
      cleanAnswers[String(question.id)] = '';
      continue;
    }

    if (!question.options.includes(trimmed)) {
      return {
        valid: false,
        error: `Invalid option selected for Question ${question.id}.`,
      };
    }

    cleanAnswers[String(question.id)] = trimmed;
  }

  return {
    valid: true,
    sanitized: {
      submissionId: rawId,
      name: rawName,
      consent: true,
      answers: cleanAnswers,
    },
  };
}

export function computeSurveyAnalytics(
  submissions: readonly SurveySubmissionRecord[],
): SurveyAnalyticsReport {
  const totalSubmissions = submissions.length;
  let totalAnsweredAll = 0;
  const totalPossibleAll = totalSubmissions * ALL_QUESTIONS.length;

  const questionAnalytics: QuestionAnalytics[] = ALL_QUESTIONS.map((question) => {
    const section = SURVEY_SECTIONS.find((s) => s.id === question.sectionId)!;
    const counts = new Map<string, number>();
    for (const opt of question.options) {
      counts.set(opt, 0);
    }

    let answeredCount = 0;
    for (const sub of submissions) {
      const value = sub.answers[String(question.id)] || sub.answers[question.key] || '';
      if (value && counts.has(value)) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
        answeredCount += 1;
      }
    }

    totalAnsweredAll += answeredCount;
    const skippedCount = totalSubmissions - answeredCount;
    const responseRate = totalSubmissions > 0 ? (answeredCount / totalSubmissions) * 100 : 0;

    const optionEntries: OptionAnalytics[] = question.options.map((opt, idx) => {
      const count = counts.get(opt) ?? 0;
      const percentage = answeredCount > 0 ? (count / answeredCount) * 100 : 0;
      return {
        option: opt,
        originalIndex: idx,
        count,
        percentage,
        rank: null,
      };
    });

    // Standard competition ranking: highest count gets rank 1; ties share equal rank.
    // Preserves original option order when displaying ties.
    if (answeredCount > 0) {
      for (const item of optionEntries) {
        let strictlyHigher = 0;
        for (const other of optionEntries) {
          if (other.count > item.count) {
            strictlyHigher += 1;
          }
        }
        item.rank = strictlyHigher + 1;
      }
    }

    const sortedOptions = [...optionEntries].sort((a, b) => {
      if (a.rank === null || b.rank === null) {
        return a.originalIndex - b.originalIndex;
      }
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return a.originalIndex - b.originalIndex;
    });

    const topOptions =
      answeredCount > 0
        ? sortedOptions.filter((o) => o.rank === 1).map((o) => o.option)
        : [];

    return {
      id: question.id,
      key: question.key,
      sectionId: question.sectionId,
      sectionTitle: section.title,
      text: question.text,
      answeredCount,
      skippedCount,
      responseRate,
      options: sortedOptions,
      topOptions,
    };
  });

  const sections: SectionAnalytics[] = SURVEY_SECTIONS.map((sec) => {
    const secQuestions = questionAnalytics.filter((q) => q.sectionId === sec.id);
    const totalAnsweredSlots = secQuestions.reduce((sum, q) => sum + q.answeredCount, 0);
    const totalPossibleSlots = totalSubmissions * sec.questions.length;
    const averageCompletionRate =
      totalPossibleSlots > 0 ? (totalAnsweredSlots / totalPossibleSlots) * 100 : 0;

    return {
      sectionId: sec.id,
      title: sec.title,
      questionCount: sec.questions.length,
      averageCompletionRate,
      totalAnsweredSlots,
      totalPossibleSlots,
    };
  });

  const sortedByTime = [...submissions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return {
    totalSubmissions,
    overallCompletionRate:
      totalPossibleAll > 0 ? (totalAnsweredAll / totalPossibleAll) * 100 : 0,
    latestSubmissionAt: sortedByTime[0]?.timestamp ?? null,
    sections,
    questions: questionAnalytics,
  };
}
