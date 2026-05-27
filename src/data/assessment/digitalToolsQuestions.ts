import { PsychQuestion } from '@/types/assessment';

// Reuse PsychQuestion shape with category = 'digital_tools' subcategories
export type DigitalToolCategory = 
  | 'google_workspace'
  | 'video_conferencing'
  | 'interactive_tools'
  | 'lms_platforms'
  | 'assessment_tools'
  | 'collaboration';

export interface DigitalToolQuestion {
  id: string;
  category: DigitalToolCategory;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  topic: string;
}

export const DIGITAL_TOOL_CATEGORY_LABELS: Record<DigitalToolCategory, string> = {
  google_workspace: 'Google Workspace',
  video_conferencing: 'Video Conferencing & Online Classes',
  interactive_tools: 'Interactive & Game-Based Tools',
  lms_platforms: 'Learning Management Systems',
  assessment_tools: 'Digital Assessment & Quizzes',
  collaboration: 'Collaboration & Whiteboarding',
};

export interface ToolSelfRating {
  id: string;
  tool: string;
  icon: string; // emoji
}

export const toolSelfRatings: ToolSelfRating[] = [
  { id: 'rate_google_docs', tool: 'Google Docs / Slides / Sheets', icon: '📄' },
  { id: 'rate_google_classroom', tool: 'Google Classroom', icon: '🏫' },
  { id: 'rate_zoom', tool: 'Zoom', icon: '📹' },
  { id: 'rate_google_meet', tool: 'Google Meet', icon: '🎥' },
  { id: 'rate_miro', tool: 'Miro / Jamboard', icon: '🎨' },
  { id: 'rate_kahoot', tool: 'Kahoot! / Quizizz', icon: '🎮' },
  { id: 'rate_canva', tool: 'Canva', icon: '🖼️' },
  { id: 'rate_lms', tool: 'LMS (Moodle, Canvas, etc.)', icon: '📚' },
  { id: 'rate_ms_teams', tool: 'Microsoft Teams', icon: '💬' },
  { id: 'rate_notion', tool: 'Notion / Trello', icon: '📋' },
];

export const RATING_LABELS = ['Never used', 'Heard of it', 'Basic use', 'Comfortable', 'Expert'];

export const digitalToolsQuestions: DigitalToolQuestion[] = [
  // GOOGLE WORKSPACE
  {
    id: 'dt_gw_1',
    category: 'google_workspace',
    question: 'In Google Classroom, how do you schedule an assignment to be posted at a future date?',
    options: [
      'Click "Assign" and it posts immediately — scheduling is not possible',
      'Click the dropdown arrow next to "Assign" and select "Schedule"',
      'Save it as a draft and manually post it later',
      'Use Google Calendar to schedule the post',
    ],
    correctAnswer: 1,
    topic: 'Google Classroom',
  },
  {
    id: 'dt_gw_2',
    category: 'google_workspace',
    question: 'Which Google Workspace tool is best for creating a collaborative presentation with students?',
    options: [
      'Google Docs',
      'Google Sheets',
      'Google Slides',
      'Google Forms',
    ],
    correctAnswer: 2,
    topic: 'Google Workspace',
  },
  {
    id: 'dt_gw_3',
    category: 'google_workspace',
    question: 'How can you provide individualized feedback on a student\'s Google Docs submission?',
    options: [
      'Edit the document directly',
      'Use the "Suggesting" mode and add comments',
      'Send them a separate email with feedback',
      'Print it, mark it, and scan it back',
    ],
    correctAnswer: 1,
    topic: 'Google Docs',
  },
  {
    id: 'dt_gw_4',
    category: 'google_workspace',
    question: 'What is Google Forms primarily used for in education?',
    options: [
      'Creating lesson plans',
      'Video conferencing',
      'Creating surveys, quizzes, and collecting responses',
      'Managing student attendance only',
    ],
    correctAnswer: 2,
    topic: 'Google Forms',
  },

  // VIDEO CONFERENCING
  {
    id: 'dt_vc_1',
    category: 'video_conferencing',
    question: 'In Google Meet, which feature allows you to divide students into small discussion groups?',
    options: [
      'Polls',
      'Breakout rooms',
      'Screen sharing',
      'Chat rooms',
    ],
    correctAnswer: 1,
    topic: 'Google Meet',
  },
  {
    id: 'dt_vc_2',
    category: 'video_conferencing',
    question: 'What is the best practice when conducting an online class via Zoom or Google Meet?',
    options: [
      'Keep your camera off to save bandwidth',
      'Let students join with microphones unmuted',
      'Share your screen, use a structured agenda, and mute students by default',
      'Only use the chat — no voice or video needed',
    ],
    correctAnswer: 2,
    topic: 'Video Conferencing',
  },
  {
    id: 'dt_vc_3',
    category: 'video_conferencing',
    question: 'Which feature in Zoom allows you to gauge student understanding during a live class?',
    options: [
      'Virtual backgrounds',
      'Polls and reactions',
      'Waiting room',
      'Recording',
    ],
    correctAnswer: 1,
    topic: 'Zoom',
  },

  // INTERACTIVE & GAME-BASED TOOLS
  {
    id: 'dt_it_1',
    category: 'interactive_tools',
    question: 'Kahoot! is primarily used in education for:',
    options: [
      'Writing essays collaboratively',
      'Creating interactive quizzes and game-based learning',
      'Managing student grades',
      'Video conferencing',
    ],
    correctAnswer: 1,
    topic: 'Kahoot!',
  },
  {
    id: 'dt_it_2',
    category: 'interactive_tools',
    question: 'Which tool allows students to respond to questions anonymously in real-time during a lesson?',
    options: [
      'Google Docs',
      'Mentimeter or Slido',
      'Microsoft Word',
      'WhatsApp',
    ],
    correctAnswer: 1,
    topic: 'Interactive Polling',
  },
  {
    id: 'dt_it_3',
    category: 'interactive_tools',
    question: 'What is Quizizz best known for?',
    options: [
      'Spreadsheet management',
      'Self-paced gamified quizzes that students can take anytime',
      'Video editing',
      'File storage',
    ],
    correctAnswer: 1,
    topic: 'Quizizz',
  },
  {
    id: 'dt_it_4',
    category: 'interactive_tools',
    question: 'Which educational game platform uses a "board game" format to review vocabulary and concepts?',
    options: [
      'Blooket',
      'PowerPoint',
      'Google Forms',
      'Canva',
    ],
    correctAnswer: 0,
    topic: 'Game-Based Learning',
  },

  // LMS PLATFORMS
  {
    id: 'dt_lms_1',
    category: 'lms_platforms',
    question: 'What does LMS stand for in education technology?',
    options: [
      'Learning Management System',
      'Lesson Material Storage',
      'Live Meeting Software',
      'Library Management System',
    ],
    correctAnswer: 0,
    topic: 'LMS',
  },
  {
    id: 'dt_lms_2',
    category: 'lms_platforms',
    question: 'Which of these is NOT a Learning Management System?',
    options: [
      'Google Classroom',
      'Moodle',
      'Canva',
      'Canvas',
    ],
    correctAnswer: 2,
    topic: 'LMS',
  },
  {
    id: 'dt_lms_3',
    category: 'lms_platforms',
    question: 'In Google Classroom, the "Stream" tab is used for:',
    options: [
      'Grading assignments',
      'Posting announcements and class discussions',
      'Creating quizzes',
      'Video calls',
    ],
    correctAnswer: 1,
    topic: 'Google Classroom',
  },

  // ASSESSMENT TOOLS
  {
    id: 'dt_at_1',
    category: 'assessment_tools',
    question: 'Which Google tool allows you to create auto-graded quizzes with instant feedback?',
    options: [
      'Google Docs',
      'Google Slides',
      'Google Forms (Quiz mode)',
      'Google Drive',
    ],
    correctAnswer: 2,
    topic: 'Google Forms',
  },
  {
    id: 'dt_at_2',
    category: 'assessment_tools',
    question: 'What is the advantage of using Quizizz over a paper-based test?',
    options: [
      'It costs more',
      'Students get instant feedback and it auto-grades',
      'It requires no internet',
      'It only works on desktop computers',
    ],
    correctAnswer: 1,
    topic: 'Digital Assessment',
  },
  {
    id: 'dt_at_3',
    category: 'assessment_tools',
    question: 'Formative assessment using digital tools means:',
    options: [
      'Only giving final exams online',
      'Checking student understanding continuously during learning using polls, quizzes, etc.',
      'Posting grades on social media',
      'Printing worksheets from the internet',
    ],
    correctAnswer: 1,
    topic: 'Formative Assessment',
  },

  // COLLABORATION & WHITEBOARDING
  {
    id: 'dt_co_1',
    category: 'collaboration',
    question: 'Miro is an online tool primarily used for:',
    options: [
      'Sending emails',
      'Collaborative whiteboarding, brainstorming, and mind mapping',
      'Playing music',
      'Managing school finances',
    ],
    correctAnswer: 1,
    topic: 'Miro',
  },
  {
    id: 'dt_co_2',
    category: 'collaboration',
    question: 'Which tool is best for creating visual mind maps and collaborative diagrams with students?',
    options: [
      'Google Sheets',
      'Miro or Jamboard',
      'WhatsApp',
      'Notepad',
    ],
    correctAnswer: 1,
    topic: 'Whiteboarding',
  },
  {
    id: 'dt_co_3',
    category: 'collaboration',
    question: 'Google Jamboard is being discontinued. Which alternative is recommended for collaborative whiteboarding?',
    options: [
      'Google Docs',
      'FigJam or Miro',
      'Google Sheets',
      'YouTube',
    ],
    correctAnswer: 1,
    topic: 'Collaboration Tools',
  },
];
