export interface Lecture {
  title: string;
  duration: string;
  preview?: boolean;
}

export interface Section {
  title: string;
  lectures: Lecture[];
  totalDuration: string;
}

export interface Course {
  id: string;
  thumbnail: string;
  title: string;
  description: string;
  fullDescription: string;
  instructor: string;
  rating: number;
  reviews: number;
  students: number;
  price: string;
  oldPrice: string;
  discount: number;
  totalDuration: string;
  lessons: number;
  sections: Section[];
}

export const COURSES: Course[] = [
  {
    id: "cloud-computing-essentials",
    thumbnail: "https://placehold.co/600x340/1e293b/ffffff?text=Course+1",
    title: "Cloud Computing Essentials",
    description: "Master AWS, Azure & GCP fundamentals with hands-on projects.",
    fullDescription:
      "Learn the foundations of cloud computing and explore popular cloud platforms like AWS, Azure, and Google Cloud. This course is ideal for IT professionals and developers who want to build scalable, reliable cloud-based solutions from scratch.",
    instructor: "Learnovora",
    rating: 5,
    reviews: 1,
    students: 2,
    price: "199",
    oldPrice: "499",
    discount: 20,
    totalDuration: "49 hours, 30 minutes",
    lessons: 4,
    sections: [
      {
        title: "Cloud Fundamentals",
        totalDuration: "22 hours",
        lectures: [
          { title: "What is Cloud Computing?", duration: "10 hours", preview: true },
          { title: "Cloud Service Models", duration: "12 hours" },
        ],
      },
      {
        title: "Exploring Cloud Platforms",
        totalDuration: "27 hours, 30 minutes",
        lectures: [
          { title: "Introduction to AWS", duration: "10 hours", preview: true },
          { title: "Azure Fundamentals", duration: "9 hours" },
          { title: "Google Cloud Overview", duration: "8 hours, 30 minutes" },
        ],
      },
    ],
  },
  {
    id: "advanced-python-programming",
    thumbnail: "https://placehold.co/600x340/facc15/1e293b?text=Course+2",
    title: "Advanced Python Programming",
    description: "Deep dive into Python with real-world crash course projects.",
    fullDescription:
      "Take your Python skills to the next level with advanced topics including decorators, generators, async programming, and real-world project builds. Perfect for developers who already know the basics and want to write production-grade Python code.",
    instructor: "Learnovora",
    rating: 4,
    reviews: 1,
    students: 3,
    price: "199",
    oldPrice: "599",
    discount: 25,
    totalDuration: "38 hours",
    lessons: 5,
    sections: [
      {
        title: "Python Deep Dive",
        totalDuration: "18 hours",
        lectures: [
          { title: "Decorators & Generators", duration: "6 hours", preview: true },
          { title: "Async Programming", duration: "7 hours" },
          { title: "Type Hints & Dataclasses", duration: "5 hours" },
        ],
      },
      {
        title: "Real-World Projects",
        totalDuration: "20 hours",
        lectures: [
          { title: "Build a REST API", duration: "10 hours", preview: true },
          { title: "Automation Scripts", duration: "10 hours" },
        ],
      },
    ],
  },
  {
    id: "web-development-bootcamp",
    thumbnail: "https://placehold.co/600x340/0f172a/ffffff?text=Course+3",
    title: "Web Development Bootcamp",
    description: "Master React JS with 3 full projects from scratch.",
    fullDescription:
      "A comprehensive bootcamp covering HTML, CSS, JavaScript, and React JS. You will build 3 complete projects including a portfolio site, a task manager, and a full e-commerce UI. Ideal for beginners and intermediate developers.",
    instructor: "Learnovora",
    rating: 5,
    reviews: 1,
    students: 5,
    price: "199",
    oldPrice: "799",
    discount: 25,
    totalDuration: "60 hours",
    lessons: 6,
    sections: [
      {
        title: "HTML & CSS Foundations",
        totalDuration: "15 hours",
        lectures: [
          { title: "HTML Structure & Semantics", duration: "5 hours", preview: true },
          { title: "CSS Layouts & Flexbox", duration: "5 hours" },
          { title: "Responsive Design", duration: "5 hours" },
        ],
      },
      {
        title: "React JS Mastery",
        totalDuration: "45 hours",
        lectures: [
          { title: "Components & Props", duration: "10 hours", preview: true },
          { title: "State & Hooks", duration: "15 hours" },
          { title: "Project: E-Commerce UI", duration: "20 hours" },
        ],
      },
    ],
  },
  {
    id: "cybersecurity-basics",
    thumbnail: "https://placehold.co/600x340/1e3a5f/ffffff?text=Course+4",
    title: "Cybersecurity Basics",
    description: "Build and secure the largest crypto marketplace UI.",
    fullDescription:
      "Understand the core principles of cybersecurity including threat modeling, network security, and ethical hacking basics. Learn how to protect web applications and build secure systems from the ground up.",
    instructor: "Learnovora",
    rating: 4,
    reviews: 1,
    students: 2,
    price: "199",
    oldPrice: "499",
    discount: 26,
    totalDuration: "32 hours",
    lessons: 4,
    sections: [
      {
        title: "Security Fundamentals",
        totalDuration: "14 hours",
        lectures: [
          { title: "Threat Modeling", duration: "6 hours", preview: true },
          { title: "Network Security Basics", duration: "8 hours" },
        ],
      },
      {
        title: "Ethical Hacking Intro",
        totalDuration: "18 hours",
        lectures: [
          { title: "Penetration Testing 101", duration: "9 hours", preview: true },
          { title: "Securing Web Apps", duration: "9 hours" },
        ],
      },
    ],
  },
  {
    id: "javascript-fundamentals",
    thumbnail: "https://placehold.co/600x340/1e293b/facc15?text=Course+5",
    title: "JavaScript Fundamentals",
    description: "Learn core JS concepts with interactive coding exercises.",
    fullDescription:
      "A beginner-friendly course covering all JavaScript fundamentals including variables, functions, DOM manipulation, events, and ES6+ features. Build interactive web pages and understand how the web works under the hood.",
    instructor: "Learnovora",
    rating: 5,
    reviews: 2,
    students: 8,
    price: "199",
    oldPrice: "499",
    discount: 23,
    totalDuration: "28 hours",
    lessons: 5,
    sections: [
      {
        title: "JS Core Concepts",
        totalDuration: "14 hours",
        lectures: [
          { title: "Variables & Data Types", duration: "4 hours", preview: true },
          { title: "Functions & Scope", duration: "5 hours" },
          { title: "Arrays & Objects", duration: "5 hours" },
        ],
      },
      {
        title: "DOM & Events",
        totalDuration: "14 hours",
        lectures: [
          { title: "DOM Manipulation", duration: "7 hours", preview: true },
          { title: "Event Handling", duration: "7 hours" },
        ],
      },
    ],
  },
  {
    id: "full-stack-coming-soon",
    thumbnail: "https://placehold.co/600x340/7c3aed/ffffff?text=Course+6",
    title: "Coming Soon — Full Stack",
    description: "Build a complete coming soon page with modern animations.",
    fullDescription:
      "Learn to build a full-stack web application from scratch using Node.js, Express, MongoDB, and React. This course covers both frontend and backend development with real deployment on cloud platforms.",
    instructor: "Learnovora",
    rating: 4,
    reviews: 1,
    students: 4,
    price: "199",
    oldPrice: "999",
    discount: 27,
    totalDuration: "55 hours",
    lessons: 6,
    sections: [
      {
        title: "Backend with Node & Express",
        totalDuration: "25 hours",
        lectures: [
          { title: "REST API Design", duration: "10 hours", preview: true },
          { title: "MongoDB & Mongoose", duration: "8 hours" },
          { title: "Authentication & JWT", duration: "7 hours" },
        ],
      },
      {
        title: "Frontend Integration",
        totalDuration: "30 hours",
        lectures: [
          { title: "React + API Integration", duration: "15 hours", preview: true },
          { title: "Deployment on Vercel & Render", duration: "15 hours" },
        ],
      },
    ],
  },
  {
    id: "image-search-engine",
    thumbnail: "https://placehold.co/600x340/0ea5e9/ffffff?text=Course+7",
    title: "Image Search Engine",
    description: "Create a fully functional image search engine app.",
    fullDescription:
      "Build a fully functional image search engine using the Unsplash API, React, and Tailwind CSS. Learn API integration, infinite scroll, search debouncing, and responsive UI design in this hands-on project course.",
    instructor: "Learnovora",
    rating: 5,
    reviews: 3,
    students: 10,
    price: "199",
    oldPrice: "399",
    discount: 27,
    totalDuration: "18 hours",
    lessons: 3,
    sections: [
      {
        title: "Project Setup & API",
        totalDuration: "8 hours",
        lectures: [
          { title: "Unsplash API Integration", duration: "4 hours", preview: true },
          { title: "Search & Debouncing", duration: "4 hours" },
        ],
      },
      {
        title: "UI & Polish",
        totalDuration: "10 hours",
        lectures: [
          { title: "Infinite Scroll", duration: "5 hours", preview: true },
          { title: "Responsive Layout", duration: "5 hours" },
        ],
      },
    ],
  },
  {
    id: "complete-website-react",
    thumbnail: "https://placehold.co/600x340/ef4444/ffffff?text=Course+8",
    title: "Complete Website in React JS",
    description: "Build a production-ready complete website using React JS.",
    fullDescription:
      "Create a complete multi-page website using React JS with routing, animations, and a contact form. This course walks you through building a professional website from design to deployment, covering best practices along the way.",
    instructor: "Learnovora",
    rating: 4,
    reviews: 2,
    students: 6,
    price: "199",
    oldPrice: "699",
    discount: 24,
    totalDuration: "35 hours",
    lessons: 5,
    sections: [
      {
        title: "Project Architecture",
        totalDuration: "15 hours",
        lectures: [
          { title: "Routing with React Router", duration: "6 hours", preview: true },
          { title: "Component Structure", duration: "5 hours" },
          { title: "State Management", duration: "4 hours" },
        ],
      },
      {
        title: "Finishing & Deployment",
        totalDuration: "20 hours",
        lectures: [
          { title: "Animations & Transitions", duration: "8 hours", preview: true },
          { title: "Deploy to Vercel", duration: "12 hours" },
        ],
      },
    ],
  },
];
