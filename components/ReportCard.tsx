import AutoComments from "@/components/AutoComments"
import BlindSpots from "@/components/BlindSpots"
import CriticalFiles from "@/components/CriticalFiles"
import DependencyImpact from "@/components/DependencyImpact"
import ExecutiveBriefing from "@/components/ExecutiveBriefing"
import ImpactGraph from "@/components/ImpactGraph"
import ImpactMap from "@/components/ImpactMap"
import MetaBanner from "@/components/MetaBanner"
import RepoContextPanel from "@/components/RepoContextPanel"
import ReviewChecklist from "@/components/ReviewChecklist"
import ReviewConcerns from "@/components/ReviewConcerns"
import ReviewStrategy from "@/components/ReviewStrategy"
import RiskMeter from "@/components/RiskMeter"
import SummarySection from "@/components/SummarySection"
import type { PRAnalysisReport } from "@/types"

interface Props {
  report: PRAnalysisReport
}

export default function ReportCard({ report }: Props) {
  return (
    <section className="mt-10 space-y-7">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Analysis report</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Review briefing</h2>
        </div>
        <p className="text-sm text-slate-500">Generated {new Date(report.meta.analyzed_at).toLocaleString()}</p>
      </div>

      <ExecutiveBriefing report={report} />
      <ImpactGraph report={report} />
      <MetaBanner meta={report.meta} />

      <SectionHeader
        eyebrow="Decision support"
        title="Risk and summary"
        description="Use this first pass to decide how much reviewer attention this PR deserves."
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <RiskMeter risk={report.risk} />
        </div>
        <div className="md:col-span-2">
          <SummarySection summary={report.summary} />
        </div>
      </div>

      <SectionHeader
        eyebrow="Review path"
        title="Where to focus"
        description="Prioritized impact areas, active review context, and the suggested review order."
      />
      <ImpactMap impacts={report.impact_map} />
      <ReviewConcerns concerns={report.active_review_concerns} />
      <ReviewStrategy steps={report.review_strategy} />
      <ReviewChecklist items={report.review_checklist} />

      <SectionHeader
        eyebrow="Reviewer toolkit"
        title="Evidence and ready-to-use notes"
        description="Critical files, draft comments, blind spots, and downstream dependency considerations."
      />
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <CriticalFiles files={report.critical_files} />
        <AutoComments comments={report.auto_comments} />
        <BlindSpots spots={report.reviewer_blind_spots} />
        <DependencyImpact impact={report.dependency_impact} />
      </div>
      <RepoContextPanel context={report.repo_context} />
    </section>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="pt-3">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">{eyebrow}</p>
      <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="break-words text-2xl font-black tracking-tight text-white">{title}</h3>
        <p className="max-w-xl break-words text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  )
}
