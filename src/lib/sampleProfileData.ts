import type { ProfileHitOptional } from "~/types/typesense";

/**
 * Generate avatar URL from various sources
 */
export function generateAvatarUrl(name: string, _email?: string): string {
  // Use placeholder service with the person's initials

  // Use placeholder services
  const placeholderServices = [
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=random`,
    `https://avatars.dicebear.com/api/avataaars/${encodeURIComponent(name)}.svg`,
    `https://robohash.org/${encodeURIComponent(name)}?size=200x200`,
  ];

  return placeholderServices[0]!;
}

/**
 * Sample profile data for testing
 */
export const sampleProfiles: ProfileHitOptional[] = [
  {
    id: "profile_1",
    name: "Emily Rodriguez",
    username: "emilydesigns",
    title: "Senior Product Designer",
    about:
      "I create digital experiences that delight users and drive business results. Passionate about accessibility and inclusive design.",
    location: "Los Angeles, CA",
    website: "https://emilyrodriguez.design",
    profilePhotoUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    contact_email: "emily@example.com",
    linkedin_url: "https://linkedin.com/in/emilyrodriguez",
    twitter_url: "https://twitter.com/emilydesigns",
    github_url: "https://github.com/emilyrodriguez",
    skills: [
      "Product Design",
      "User Research",
      "Figma",
      "Prototyping",
      "Design Systems",
    ],
    job_titles: ["Senior Product Designer", "UX Designer", "Product Manager"],
    companies: ["Adobe", "Shopify", "Dropbox"],
    schools: ["Stanford University", "California College of the Arts"],
    project_names: [
      "Mobile Banking App",
      "E-commerce Redesign",
      "Design System 2.0",
    ],
    followers_count: 3245,
    profile_created_at: 1640995200,
    indexed_at: 1703980800,
  },
  {
    id: "profile_2",
    name: "David Kim",
    username: "davidcodes",
    title: "Full Stack Developer",
    about:
      "Building scalable web applications with modern technologies. I love solving complex problems and mentoring junior developers.",
    location: "Seattle, WA",
    website: "https://davidkim.dev",
    profilePhotoUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    contact_email: "david@example.com",
    linkedin_url: "https://linkedin.com/in/davidkim",
    twitter_url: "https://twitter.com/davidcodes",
    github_url: "https://github.com/davidkim",
    skills: ["React", "Node.js", "TypeScript", "Python", "AWS", "PostgreSQL"],
    job_titles: ["Full Stack Developer", "Software Engineer", "Tech Lead"],
    companies: ["Microsoft", "Amazon", "GitHub"],
    schools: ["University of Washington", "Coding Bootcamp"],
    project_names: ["Cloud Platform", "API Gateway", "Developer Tools"],
    followers_count: 1876,
    profile_created_at: 1609459200,
    indexed_at: 1703980800,
  },
  {
    id: "profile_3",
    name: "Priya Patel",
    username: "priyaai",
    title: "AI/ML Engineer",
    about:
      "Specializing in computer vision and natural language processing. I'm passionate about using AI to solve real-world problems.",
    location: "San Jose, CA",
    website: "https://priyapatel.ai",
    profilePhotoUrl:
      "https://images.unsplash.com/photo-1494790108755-2616c6d4e87c?w=200&h=200&fit=crop&crop=face",
    contact_email: "priya@example.com",
    linkedin_url: "https://linkedin.com/in/priyapatel",
    twitter_url: "https://twitter.com/priyaai",
    github_url: "https://github.com/priyapatel",
    skills: [
      "Machine Learning",
      "Python",
      "TensorFlow",
      "PyTorch",
      "Computer Vision",
      "NLP",
    ],
    job_titles: ["AI Engineer", "Machine Learning Engineer", "Data Scientist"],
    companies: ["Google", "OpenAI", "NVIDIA"],
    schools: ["MIT", "Stanford University"],
    project_names: [
      "Image Recognition System",
      "Chatbot Platform",
      "Recommendation Engine",
    ],
    followers_count: 5432,
    profile_created_at: 1577836800,
    indexed_at: 1703980800,
  },
  {
    id: "profile_4",
    name: "James Wilson",
    username: "jameswilson",
    title: "Creative Director",
    about:
      "Award-winning creative director with expertise in branding, advertising, and digital campaigns. I help brands tell compelling stories.",
    location: "New York, NY",
    website: "jameswilson.co",
    // Testing fallback avatar
    contact_email: "james@example.com",
    linkedin_url: "https://linkedin.com/in/jameswilson",
    twitter_url: "https://twitter.com/jameswilson",
    skills: [
      "Creative Direction",
      "Branding",
      "Adobe Creative Suite",
      "Campaign Strategy",
    ],
    job_titles: ["Creative Director", "Art Director", "Brand Strategist"],
    companies: ["Ogilvy", "Wieden+Kennedy", "Droga5"],
    schools: ["Parsons School of Design", "Art Center"],
    project_names: [
      "Super Bowl Campaign",
      "Brand Rebrand",
      "Digital Experience",
    ],
    followers_count: 2987,
    profile_created_at: 1546300800,
    indexed_at: 1703980800,
  },
];

/**
 * Generate random profile data for testing
 */
export function generateRandomProfile(id: string): ProfileHitOptional {
  const firstNames = [
    "Alex",
    "Jordan",
    "Casey",
    "Morgan",
    "Riley",
    "Avery",
    "Quinn",
    "Sage",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Brown",
    "Davis",
    "Miller",
    "Wilson",
    "Moore",
    "Taylor",
  ];
  const titles = [
    "Senior UX Designer",
    "Product Manager",
    "Software Engineer",
    "Creative Director",
    "Data Scientist",
    "Frontend Developer",
    "UI Designer",
    "Full Stack Developer",
  ];
  const locations = [
    "San Francisco, CA",
    "New York, NY",
    "Austin, TX",
    "Seattle, WA",
    "Chicago, IL",
    "Boston, MA",
    "Los Angeles, CA",
    "Denver, CO",
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]!;
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]!;
  const name = `${firstName} ${lastName}`;
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
  const email = `${username}@example.com`;
  const title = titles[Math.floor(Math.random() * titles.length)]!;

  return {
    id,
    name,
    username,
    title,
    about: `Passionate professional with expertise in ${title.toLowerCase()}. I love creating amazing experiences and solving complex problems.`,
    location: locations[Math.floor(Math.random() * locations.length)]!,
    website: `https://${username}.dev`,
    profilePhotoUrl: generateAvatarUrl(name, email),
    contact_email: email,
    linkedin_url: `https://linkedin.com/in/${username}`,
    twitter_url: `https://twitter.com/${username}`,
    github_url: `https://github.com/${username}`,
    skills: ["React", "TypeScript", "Design", "Python"].slice(
      0,
      Math.floor(Math.random() * 4) + 2,
    ),
    job_titles: [title],
    companies: ["Google", "Apple", "Microsoft"].slice(
      0,
      Math.floor(Math.random() * 3) + 1,
    ),
    schools: ["Stanford", "MIT"].slice(0, Math.floor(Math.random() * 2) + 1),
    project_names: ["Web App", "Mobile App", "API"].slice(
      0,
      Math.floor(Math.random() * 3) + 1,
    ),
    followers_count: Math.floor(Math.random() * 10000) + 100,
    profile_created_at:
      Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 31536000), // Random date within last year
    indexed_at: Math.floor(Date.now() / 1000),
  };
}
