import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { batteryProjects } from '@/lib/projects';
import { panels as panelRepo } from '@/lib/repos';
import { ProjectEditor } from './ProjectEditor';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  const { id } = await params;
  const project = batteryProjects.get(parseInt(id, 10));
  if (!project) notFound();
  const panels = batteryProjects.panels(project.id);
  return (
    <div className="space-y-4">
      <Link href="/projects" className="text-sm text-muted no-underline">← Projects</Link>
      <h1 className="text-2xl font-bold text-head">{project.name}</h1>
      <p className="text-muted text-sm">
        {project.standby_hours} h standby · {project.alarm_minutes} min alarm · ageing ×{project.ageing_factor.toFixed(2)}
      </p>
      <ProjectEditor
        project={project}
        initial={panels}
        catalogue={panelRepo.list().map(p => ({ slug: p.slug, name: p.name }))}
        canEdit={me.role !== 'viewer'}
      />
    </div>
  );
}
