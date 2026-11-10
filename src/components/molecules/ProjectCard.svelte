<script lang="ts">
// Cover-first layout adapted from Firefly ProjectCard.astro (MIT); see THIRD_PARTY_NOTICES.md.
import Icon from "@components/atoms/display/Icon.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { reveal } from "@utils/motion";
import { url } from "@utils/url-utils";
import type { ProjectItem, ProjectPhase } from "@/types/projectsConfig";
let { project, delay = 0 }: { project: ProjectItem; delay?: number } = $props();
let coverFailed = $state(false);
const phases: Record<ProjectPhase, I18nKey> = {
	shipped: I18nKey.projectPhaseShipped,
	building: I18nKey.projectPhaseBuilding,
	exploring: I18nKey.projectPhaseExploring,
};
const detail = $derived(
	project.details
		? url(`/projects/${encodeURIComponent(project.key)}/`)
		: undefined,
);
</script>

<article class={`project-card ${project.featured ? "project-card--featured" : ""}`} data-project={project.key} use:reveal={{delay}}>
 <a class="project-card__cover" href={detail ?? project.website ?? project.repository} aria-label={`${project.title} · ${i18n(phases[project.phase])}`}>
  {#if project.cover && !coverFailed}<img src={project.cover} alt={project.coverAlt ?? ""} loading="lazy" decoding="async" onerror={() => coverFailed = true} />
  {:else}<Icon icon={project.icon ?? "material-symbols:rocket-launch-rounded"} width={64} height={64} />{/if}
  <span class="project-card__phase" data-phase={project.phase}>{i18n(phases[project.phase])}</span>
  <span class="project-card__cover-arrow" aria-hidden="true"><Icon icon="material-symbols:chevron-right-rounded" width={48} height={48} /></span>
 </a>
 <div class="project-card__body">
  <h2 class="project-card__title">{#if detail}<a href={detail}>{project.title}</a>{:else}{project.title}{/if}</h2>
  <div class="project-card__meta">
   {#if project.year}<span><Icon icon="material-symbols:calendar-today-outline-rounded" width={18} height={18} />{project.year}</span>{/if}
   {#if project.technologies.length}<span><Icon icon="material-symbols:tag-rounded" width={18} height={18} />{project.technologies.slice(0,2).join(" / ")}{project.technologies.length > 2 ? ` +${project.technologies.length - 2}` : ""}</span>{/if}
  </div>
  <p class="project-card__summary">{project.summary}</p>
  <div class="project-card__actions">
   {#if project.website}<a class="m3-state-layer" href={project.website} target="_blank" rel="noopener noreferrer"><Icon icon="material-symbols:open-in-new-rounded" width={16} height={16} />{i18n(I18nKey.projectVisit)}</a>{/if}
   {#if project.repository}<a class="m3-state-layer" href={project.repository} target="_blank" rel="noopener noreferrer"><Icon icon="fa7-brands:github" width={16} height={16} />{i18n(I18nKey.projectSource)}</a>{/if}
   {#if detail}<a class="project-card__details m3-state-layer" href={detail}>{i18n(I18nKey.projectDetails)}<Icon icon="material-symbols:chevron-right-rounded" width={16} height={16} /></a>{/if}
  </div>
 </div>
</article>

<style>
.project-card{display:flex;flex-direction:column;min-width:0;overflow:hidden;border-radius:var(--shape-corner-l);background:var(--surface-container-low);color:var(--on-surface)}
.project-card__cover{display:flex;position:relative;align-items:center;justify-content:center;aspect-ratio:2/1;margin:var(--m3e-space-4) var(--m3e-space-4) 0;overflow:hidden;border-radius:var(--shape-corner-m);background:var(--surface-container-high);color:var(--primary)}
.project-card__cover img{width:100%;height:100%;object-fit:cover;transition:transform var(--m3e-duration-medium) var(--m3e-easing-standard)}
.project-card__cover:hover img{transform:scale(1.05)}
.project-card__phase{position:absolute;top:var(--m3e-space-3);right:var(--m3e-space-3);padding:var(--m3e-space-1) var(--m3e-space-3);border-radius:var(--shape-corner-full);background:var(--primary-container);color:var(--on-primary-container);font:var(--m3e-type-label-small)}
.project-card__cover-arrow{display:grid;place-items:center;position:absolute;inset:0;opacity:0;transition:opacity var(--m3e-duration-short) var(--m3e-easing-standard);background:color-mix(in oklab,var(--scrim) 60%,transparent);color:var(--inverse-on-surface)}
.project-card__cover:hover .project-card__cover-arrow{opacity:1}
.project-card__body{display:flex;flex-direction:column;flex:1;padding:var(--m3e-space-4);gap:var(--m3e-space-2)}
.project-card__title{margin:0;font:var(--m3e-type-title-large);font-weight:700;line-height:1.35}
.project-card__title a{color:inherit;text-decoration:none}.project-card__title a:hover{color:var(--primary)}
.project-card__meta{display:flex;flex-wrap:wrap;gap:var(--m3e-space-4);font:var(--m3e-type-label-medium);color:var(--on-surface-variant)}
.project-card__meta span{display:flex;align-items:center;gap:var(--m3e-space-2)}
.project-card__summary{margin:0;color:var(--on-surface-variant);font:var(--m3e-type-body-medium);line-height:1.7;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.project-card__actions{display:flex;align-items:center;flex-wrap:wrap;gap:var(--m3e-space-2);margin-top:auto;padding-top:var(--m3e-space-3)}
.project-card__actions a{position:relative;display:inline-flex;align-items:center;gap:var(--m3e-space-1);border-radius:var(--shape-corner-s);padding:var(--m3e-space-2);font:var(--m3e-type-label-small);background:var(--primary-container);color:var(--on-primary-container);text-decoration:none}
.project-card__actions .project-card__details{margin-left:auto;background:transparent;color:var(--on-surface-variant)}
.project-card a:focus-visible{outline:2px solid var(--primary);outline-offset:-2px}
@media(prefers-reduced-motion:reduce){.project-card__cover img,.project-card__cover-arrow{transition:none}.project-card__cover:hover img{transform:none}}
</style>
