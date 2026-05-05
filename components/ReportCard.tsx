import AutoComments from "@/components/AutoComments"
import BlindSpots from "@/components/BlindSpots"
import CriticalFiles from "@/components/CriticalFiles"
import DependencyImpact from "@/components/DependencyImpact"
import ImpactMap from "@/components/ImpactMap"
import MetaBanner from "@/components/MetaBanner"
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
    <section className="mt-10 space-y-6">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Analysis report</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Review briefing</h2>
        </div>
        <p className="text-sm text-slate-500">Generated {new Date(report.meta.analyzed_at).toLocaleString()}</p>
      </div>
      <MetaBanner meta={report.meta} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <RiskMeter risk={report.risk} />
        </div>
        <div className="md:col-span-2">
          <SummarySection summary={report.summary} />
        </div>
      </div>
      <ImpactMap impacts={report.impact_map} />
      <ReviewConcerns concerns={report.active_review_concerns} />
      <ReviewStrategy steps={report.review_strategy} />
      <CriticalFiles files={report.critical_files} />
      <AutoComments comments={report.auto_comments} />
      <BlindSpots spots={report.reviewer_blind_spots} />
      <DependencyImpact impact={report.dependency_impact} />
    </section>
  )
}
