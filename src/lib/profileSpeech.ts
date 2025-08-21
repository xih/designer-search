import type { ProfileHitOptional } from "~/types/typesense";

export function generateProfileSpeech(profile: ProfileHitOptional): string {
  const parts: string[] = [];

  // Greeting with name
  if (profile.name) {
    parts.push(`Hi there! I'm ${profile.name}.`);
  } else {
    parts.push("Hi there!");
  }

  // Title and location
  if (profile.title) {
    parts.push(`I'm a ${profile.title}`);
    if (profile.location) {
      parts.push(`based in ${profile.location}.`);
    } else {
      parts.push(".");
    }
  } else if (profile.location) {
    parts.push(`I'm located in ${profile.location}.`);
  }

  // About section
  if (profile.about) {
    parts.push(profile.about);
  }

  // Companies
  if (profile.companies && profile.companies.length > 0) {
    if (profile.companies.length === 1) {
      parts.push(`I work at ${profile.companies[0]}.`);
    } else if (profile.companies.length === 2) {
      parts.push(`I work at ${profile.companies[0]} and ${profile.companies[1]}.`);
    } else {
      const lastCompany = profile.companies[profile.companies.length - 1];
      const otherCompanies = profile.companies.slice(0, -1).join(", ");
      parts.push(`I work at ${otherCompanies}, and ${lastCompany}.`);
    }
  }

  // Skills
  if (profile.skills && profile.skills.length > 0) {
    const skillCount = profile.skills.length;
    if (skillCount <= 3) {
      parts.push(`My skills include ${profile.skills.join(", ")}.`);
    } else {
      const topSkills = profile.skills.slice(0, 3);
      parts.push(`Some of my key skills include ${topSkills.join(", ")}, and ${skillCount - 3} others.`);
    }
  }

  // Social presence
  const socialLinks = [];
  if (profile.linkedin_url) socialLinks.push("LinkedIn");
  if (profile.github_url) socialLinks.push("GitHub");
  if (profile.website) socialLinks.push("my website");

  if (socialLinks.length > 0) {
    parts.push(`You can find me on ${socialLinks.join(", ")}.`);
  }

  // Closing
  parts.push("Feel free to reach out if you'd like to connect!");

  return parts.join(" ");
}

export function generateShortProfileSpeech(profile: ProfileHitOptional): string {
  const parts: string[] = [];

  if (profile.name) {
    parts.push(`I'm ${profile.name}`);
  }

  if (profile.title) {
    parts.push(`a ${profile.title}`);
  }

  if (profile.location) {
    parts.push(`from ${profile.location}`);
  }

  if (parts.length === 0) {
    return "Hello! Nice to meet you.";
  }

  return parts.join(", ") + ". Nice to meet you!";
}