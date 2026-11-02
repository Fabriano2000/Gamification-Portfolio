// All portfolio text lives here. Replace the placeholders with your real info.
export const content = {
  name: 'YOUR NAME',
  role: 'DEVELOPER',
  level: 24,
  tagline: 'I build things for the web.',
  about:
    'Short bio goes here: who you are, what you love building, and what you are looking for next.',
  skills: [
    { name: 'Frontend', level: 8, tools: 'React / TypeScript' },
    { name: 'Backend', level: 7, tools: 'Node / Python / SQL' },
    { name: 'Design', level: 6, tools: 'Figma / UI / Pixel art' },
    { name: 'DevOps', level: 5, tools: 'Docker / CI / Cloud' },
  ],
  projects: [
    {
      quest: 'QUEST 01',
      title: 'PROJECT ALPHA',
      summary: 'A short line about what you built and the problem it solved.',
      details: 'Longer description: your role, the challenge, what you shipped and the result (numbers help).',
      tags: ['REACT', 'API'],
      reward: '+500 XP',
      links: [{ label: 'Live demo', href: '#' }, { label: 'Source', href: '#' }],
    },
    {
      quest: 'QUEST 02',
      title: 'PROJECT BETA',
      summary: 'Another project. Live demo + repo inside.',
      details: 'Longer description: your role, the challenge, what you shipped and the result.',
      tags: ['NODE', 'SQL'],
      reward: '+750 XP',
      links: [{ label: 'Live demo', href: '#' }, { label: 'Source', href: '#' }],
    },
    {
      quest: 'QUEST 03 ★ BOSS',
      title: 'PROJECT GAMMA',
      summary: 'Your boss-level project. Biggest impact goes here.',
      details: 'Longer description: your role, the challenge, what you shipped and the result.',
      tags: ['PYTHON', 'ML'],
      reward: '+1000 XP',
      links: [{ label: 'Live demo', href: '#' }, { label: 'Source', href: '#' }],
    },
  ],
  career: [
    { year: '2022', role: 'Junior Dev', company: 'Company A', note: 'Shipped first prod feature' },
    { year: '2024', role: 'Developer', company: 'Company B', note: 'Led a 3-person squad' },
    { year: 'NOW', role: 'Senior Dev?', company: 'Your next company', note: 'Open to new quests' },
  ],
  contact: [
    { label: 'GitHub', href: 'https://github.com/yourname' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/yourname' },
    { label: 'Email', href: 'mailto:you@email.com' },
  ],
};
