import { PsychQuestion } from '@/types/assessment';

export const psychQuestions: PsychQuestion[] = [
  // PATIENCE & COMPOSURE
  {
    id: 'psy_pat_1',
    category: 'patience',
    question: 'A student has asked you to explain the same concept for the 5th time. How do you feel?',
    options: [
      'Frustrated — they should have gotten it by now',
      'Slightly tired, but I\'ll try once more the same way',
      'I\'ll try a completely different approach to explain it',
      'Excited — this is an opportunity to find what clicks for them',
    ],
    weights: [1, 2, 4, 5],
  },
  {
    id: 'psy_pat_2',
    category: 'patience',
    question: 'A child is being disruptive during a lesson. What is your first response?',
    options: [
      'Tell them to stop immediately and threaten consequences',
      'Ignore the behavior and continue teaching',
      'Pause, acknowledge their energy, and redirect them',
      'Take a break and speak with them privately',
    ],
    weights: [1, 2, 4, 5],
  },
  {
    id: 'psy_pat_3',
    category: 'patience',
    question: 'You planned a 1-hour lesson but the student is only halfway through after 45 minutes. What do you do?',
    options: [
      'Rush through the remaining material',
      'Stop and assign the rest as homework',
      'Adjust the plan and focus on what they\'ve understood so far',
      'Note the pace for future planning and end the session positively',
    ],
    weights: [1, 2, 4, 5],
  },

  // COMMUNICATION STYLE
  {
    id: 'psy_com_1',
    category: 'communication',
    question: 'When explaining a difficult topic, which approach best describes you?',
    options: [
      'I use technical terms so students learn the proper vocabulary',
      'I simplify everything and avoid complex language',
      'I use analogies and real-world examples they can relate to',
      'I adjust my language based on each student\'s level',
    ],
    weights: [2, 3, 4, 5],
  },
  {
    id: 'psy_com_2',
    category: 'communication',
    question: 'A parent complains that their child isn\'t improving. How do you respond?',
    options: [
      'Tell them the child isn\'t putting in enough effort',
      'Promise the child will improve soon',
      'Share specific observations and suggest a plan together',
      'Ask the parent about the child\'s study habits at home and collaborate',
    ],
    weights: [1, 2, 4, 5],
  },
  {
    id: 'psy_com_3',
    category: 'communication',
    question: 'How do you typically give feedback on a student\'s wrong answer?',
    options: [
      '"That\'s wrong. The answer is..."',
      '"Not quite. Try again."',
      '"Good try! Let\'s look at it from another angle..."',
      '"I see why you thought that. Here\'s where the reasoning shifts..."',
    ],
    weights: [1, 2, 4, 5],
  },

  // ADAPTABILITY
  {
    id: 'psy_ada_1',
    category: 'adaptability',
    question: 'You arrive for a lesson and discover the student has a different topic they urgently need help with. What do you do?',
    options: [
      'Stick to your prepared lesson plan',
      'Briefly address their concern then return to the plan',
      'Switch entirely to what they need help with',
      'Blend both topics if possible, prioritizing their urgent need',
    ],
    weights: [1, 2, 4, 5],
  },
  {
    id: 'psy_ada_2',
    category: 'adaptability',
    question: 'You\'re assigned a student with a learning disability you haven\'t worked with before. What\'s your approach?',
    options: [
      'Treat them the same as other students',
      'Ask to be reassigned to a student I\'m more experienced with',
      'Research the disability and prepare adapted materials',
      'Research, consult specialists, and work closely with the parents',
    ],
    weights: [2, 1, 4, 5],
  },
  {
    id: 'psy_ada_3',
    category: 'adaptability',
    question: 'Your usual teaching method isn\'t working for a particular student. What do you do?',
    options: [
      'Keep trying — they\'ll eventually get it',
      'Move on to the next topic',
      'Try visual aids, games, or hands-on activities',
      'Observe how the student learns best and build a custom approach',
    ],
    weights: [1, 2, 4, 5],
  },

  // EMPATHY & UNDERSTANDING
  {
    id: 'psy_emp_1',
    category: 'empathy',
    question: 'A student seems unusually quiet and disengaged during a lesson. What do you do?',
    options: [
      'Continue the lesson as normal — they\'ll speak up if something is wrong',
      'Ask them directly what\'s wrong in front of others',
      'Gently check in with them privately during a break',
      'Adjust the lesson to be more interactive and observe their mood',
    ],
    weights: [1, 2, 5, 4],
  },
  {
    id: 'psy_emp_2',
    category: 'empathy',
    question: 'A student tells you they hate your subject. How do you react?',
    options: [
      'Tell them they still need to learn it regardless',
      'Feel personally offended but continue teaching',
      'Ask them what specifically they dislike and try to make it more engaging',
      'Share your own journey with the subject and find their interests to connect',
    ],
    weights: [2, 1, 4, 5],
  },
  {
    id: 'psy_emp_3',
    category: 'empathy',
    question: 'A student is struggling because of problems at home. How does this affect your teaching approach?',
    options: [
      'It\'s not my business — I focus on academics only',
      'I feel bad but don\'t know how to help',
      'I reduce pressure and create a supportive learning environment',
      'I communicate with parents/guardians and adapt expectations while maintaining learning goals',
    ],
    weights: [1, 2, 4, 5],
  },

  // PROFESSIONALISM
  {
    id: 'psy_pro_1',
    category: 'professionalism',
    question: 'You realize you made an error while teaching a concept. What do you do?',
    options: [
      'Hope no one noticed and move on',
      'Correct it next class without mentioning the mistake',
      'Immediately acknowledge and correct it',
      'Use it as a teachable moment about the importance of checking work',
    ],
    weights: [1, 2, 4, 5],
  },
  {
    id: 'psy_pro_2',
    category: 'professionalism',
    question: 'How do you prepare for each tutoring session?',
    options: [
      'I don\'t prepare much — I know the material well enough',
      'I briefly review the topics beforehand',
      'I prepare a structured lesson plan with exercises',
      'I review previous sessions, prepare materials, and set specific goals',
    ],
    weights: [1, 2, 4, 5],
  },
  {
    id: 'psy_pro_3',
    category: 'professionalism',
    question: 'A parent offers you extra money to give their child exam answers. What do you do?',
    options: [
      'Accept — it\'s extra income',
      'Decline but don\'t report it',
      'Decline firmly and explain why it\'s harmful',
      'Decline, explain the harm, and report it to the organization',
    ],
    weights: [0, 2, 4, 5],
  },

  // MOTIVATION & PASSION
  {
    id: 'psy_mot_1',
    category: 'motivation',
    question: 'Why do you want to be a tutor?',
    options: [
      'It\'s a convenient way to earn money',
      'I enjoy teaching but it\'s mainly for income',
      'I love helping students understand difficult concepts',
      'Teaching is my calling — I want to shape young minds and make a difference',
    ],
    weights: [1, 2, 4, 5],
  },
  {
    id: 'psy_mot_2',
    category: 'motivation',
    question: 'A student you\'ve been tutoring scores much higher than expected. How do you feel?',
    options: [
      'Relieved that my job is done',
      'Happy for them',
      'Proud and motivated to help more students succeed',
      'Deeply fulfilled — this is exactly why I teach',
    ],
    weights: [1, 2, 4, 5],
  },
  {
    id: 'psy_mot_3',
    category: 'motivation',
    question: 'How do you stay current with teaching methods and your subject area?',
    options: [
      'I don\'t — what I learned in school is enough',
      'I occasionally read articles or watch videos',
      'I actively seek out training and professional development',
      'I attend workshops, follow research, and experiment with new techniques',
    ],
    weights: [1, 2, 4, 5],
  },
];

export const getPsychQuestions = (): PsychQuestion[] => {
  return [...psychQuestions];
};
