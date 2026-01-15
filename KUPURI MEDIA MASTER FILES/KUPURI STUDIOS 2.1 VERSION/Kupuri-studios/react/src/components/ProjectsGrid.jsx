import React from 'react';
import ProjectCard from './ProjectCard';

function ProjectsGrid({ projects, onSelectProject, title = 'Featured Projects' }) {
  return (
    <section className="relative w-full py-24 bg-gray-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header with visual hierarchy */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h2>
          <p className="text-lg text-slate-400 max-w-2xl">
            Explore our latest work, innovative designs, and creative solutions. Each project showcases our commitment to excellence and attention to detail.
          </p>
        </div>

        {/* Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onSelectProject(project)}
            />
          ))}
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No projects yet. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProjectsGrid;
