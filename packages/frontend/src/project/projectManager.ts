// Simple project management stub for Cognomega AI Platform

export interface Project {
  id: string;
  name: string;
  files: Record<string, string>;
  lastModified: number;
}

export class ProjectManager {
  private projects: Project[] = [];

  create(name: string): Project {
    const proj: Project = {
      id: `proj_${Date.now()}`,
      name,
      files: { 'App.tsx': '// New project starter file' },
      lastModified: Date.now(),
    };
    this.projects.push(proj);
    return proj;
  }

  list(): Project[] {
    return this.projects;
  }

  get(id: string): Project | undefined {
    return this.projects.find(p => p.id === id);
  }

  save(id: string, files: Record<string, string>) {
    const proj = this.get(id);
    if (proj) {
      proj.files = files;
      proj.lastModified = Date.now();
    }
  }
}