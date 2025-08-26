export interface Work {
   id: number;
   type: "video" | "audio";
   title: string;
   date: string;
   description: string;
   visibility: "public" | "private";
}

export const works: Work[] = [
   {
      id: 1,
      type: "video",
      title: "Team Meeting - Q4 Planning",
      date: "Aug 25, 2024",
      description:
         "Quarterly planning discussion covering project roadmaps, budget allocations, and team restructuring for the upcoming quarter.",
      visibility: "public",
   },
   {
      id: 2,
      type: "audio",
      title: "Team Meeting - Q4 Planning",
      date: "Aug 25, 2024",
      description:
         "Quarterly planning discussion covering project roadmaps, budget allocations, and team restructuring for the upcoming quarter.",
      visibility: "public",
   },
   {
      id: 3,
      type: "video",
      title: "Team Meeting - Q4 Planning",
      date: "Aug 25, 2024",
      description:
         "Quarterly planning discussion covering project roadmaps, budget allocations, and team restructuring for the upcoming quarter.",
      visibility: "public",
   },
   {
      id: 4,
      type: "video",
      title: "Team Meeting - Q4 Planning",
      date: "Aug 25, 2024",
      description:
         "Quarterly planning discussion covering project roadmaps, budget allocations, and team restructuring for the upcoming quarter.",
      visibility: "public",
   },
   {
      id: 5,
      type: "video",
      title: "Team Meeting - Q4 Planning",
      date: "Aug 25, 2024",
      description:
         "Quarterly planning discussion covering project roadmaps, budget allocations, and team restructuring for the upcoming quarter.",
      visibility: "public",
   },
   {
      id: 6,
      type: "video",
      title: "Team Meeting - Q4 Planning",
      date: "Aug 25, 2024",
      description:
         "Quarterly planning discussion covering project roadmaps, budget allocations, and team restructuring for the upcoming quarter.",
      visibility: "public",
   },
];
