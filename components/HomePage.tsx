
import React from 'react';
import { SparklesIcon, SpeakerWaveIcon, UserGroupIcon, RectangleStackIcon, LightBulbIcon, BookOpenIcon, PlayIcon } from './icons';

interface HomePageProps {
  onStartCreating: () => void;
}

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center h-full border border-gray-100 dark:border-gray-800">
    <div className="bg-sky-100 dark:bg-gray-700 p-3 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300 text-sm flex-grow">{description}</p>
  </div>
);

export const HomePage: React.FC<HomePageProps> = ({ onStartCreating }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
          Welcome to <span className="text-sky-500">Better stories Ai</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Your all-in-one AI partner for creating compelling, biblically-based visual stories. From character design to final voiceover, bring your vision to life effortlessly.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<LightBulbIcon className="w-8 h-8 text-yellow-500" />}
            title="AI Brainstormer"
            description="Stuck on ideas? Generate dozens of video concepts, titles, and hooks tailored to your niche and audience in seconds."
          />
          <FeatureCard
            icon={<UserGroupIcon className="w-8 h-8 text-sky-600 dark:text-sky-400" />}
            title="Character & Scene Creator"
            description="Bring characters to life. Upload reference images to generate consistent, high-quality scenes for your narratives in a single batch."
          />
          <FeatureCard
            icon={<SparklesIcon className="w-8 h-8 text-sky-600 dark:text-sky-400" />}
            title="AI Script Generator"
            description="Craft powerful stories with ease. Generate long-form and short-form video scripts tailored to your specific niche, tone, and desired art style."
          />
          <FeatureCard
            icon={<SpeakerWaveIcon className="w-8 h-8 text-sky-600 dark:text-sky-400" />}
            title="AI Voiceover Generator"
            description="Give your stories a voice. Convert your scripts into natural-sounding audio with a variety of professional narrator voices and pacing controls."
          />
          <FeatureCard
            icon={<RectangleStackIcon className="w-8 h-8 text-sky-600 dark:text-sky-400" />}
            title="AI Thumbnail Generator"
            description="Design eye-catching thumbnails. Generate visual concepts from titles, add text overlays, and customize art styles to boost your click-through rates."
          />
           <FeatureCard
            icon={<BookOpenIcon className="w-8 h-8 text-indigo-500" />}
            title="Digital Product Generator"
            description="Monetize your audience. Create ebooks, guides, and checklists instantly to sell or give away as lead magnets."
          />
           <FeatureCard
            icon={<PlayIcon className="w-8 h-8 text-red-500" />}
            title="AI YouTube Tools"
            description="Analyze successful channels to reveal their strategy, or repurpose existing content into fresh, optimized scripts and visuals."
          />
        </div>

        <div className="mt-12 pb-10">
          <button
            onClick={onStartCreating}
            className="px-8 py-4 bg-sky-600 hover:bg-sky-700 text-white dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900 font-bold text-lg rounded-lg shadow-lg transition-transform transform hover:scale-105"
          >
            Start Creating Now
          </button>
        </div>
      </div>
    </div>
  );
};