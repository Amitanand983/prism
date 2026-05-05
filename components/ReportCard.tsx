import AutoComments from "@/components/AutoComments"
import BlindSpots from "@/components/BlindSpots"
import CriticalFiles from "@/components/CriticalFiles"
import DependencyImpact from "@/components/DependencyImpact"
import MetaBanner from "@/components/MetaBanner"
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
      <MetaBanner meta={report.meta} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <RiskMeter risk={report.risk} />
        </div>
        <div className="md:col-span-2">
          <SummarySection summary={report.summary} />
        </div>
      </div>
      <ReviewStrategy steps={report.review_strategy} />
      <CriticalFiles files={report.critical_files} />
      <AutoComments comments={report.auto_comments} />
      <BlindSpots spots={report.reviewer_blind_spots} />
      <DependencyImpact impact={report.dependency_impact} />
    </section>
  )
}
