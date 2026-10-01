export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficult: boolean;
  learned: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: { url: string };
  timestamp: number;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  subject: string;
  createdAt: number;
}