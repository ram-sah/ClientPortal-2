import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface CompetitorScore {
  name: string;
  traffic: string;
  keywords: string;
  backlinks: string;
}

interface CompetitorComparisonProps {
  companyName: string;
  clientTraffic?: string;
  clientKeywords?: string;
  clientBacklinks?: string;
  competitorScores?: CompetitorScore[];
  className?: string;
}

export function CompetitorComparison({
  companyName,
  clientTraffic = "-",
  clientKeywords = "-",
  clientBacklinks = "-",
  competitorScores = [],
  className = "",
}: CompetitorComparisonProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Competitor Comparison
          </CardTitle>
          {competitorScores.length > 0 && (
            <Badge variant="outline">
              {competitorScores.length} Competitors
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left p-3 font-medium text-secondary-700"></th>
                <th className="text-center p-3 font-medium text-secondary-900 bg-primary-50">
                  {companyName}
                </th>
                {competitorScores.map((competitor, index) => (
                  <th
                    key={index}
                    className="text-center p-3 font-medium text-secondary-700"
                  >
                    {competitor.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-secondary-100 hover:bg-gray-50">
                <td className="p-3 font-medium text-secondary-700">Traffic</td>
                <td className="text-center p-3 bg-primary-50 font-semibold text-primary-700">
                  {clientTraffic}
                </td>
                {competitorScores.map((competitor, index) => (
                  <td
                    key={index}
                    className="text-center p-3 text-secondary-600"
                  >
                    {competitor.traffic}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-secondary-100 hover:bg-gray-50">
                <td className="p-3 font-medium text-secondary-700">
                  Keyword Rankings
                </td>
                <td className="text-center p-3 bg-primary-50 font-semibold text-primary-700">
                  {clientKeywords}
                </td>
                {competitorScores.map((competitor, index) => (
                  <td
                    key={index}
                    className="text-center p-3 text-secondary-600"
                  >
                    {competitor.keywords}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 font-medium text-secondary-700">
                  Backlinks
                </td>
                <td className="text-center p-3 bg-primary-50 font-semibold text-primary-700">
                  {clientBacklinks}
                </td>
                {competitorScores.map((competitor, index) => (
                  <td
                    key={index}
                    className="text-center p-3 text-secondary-600"
                  >
                    {competitor.backlinks}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {competitorScores.length === 0 && (
          <div className="text-center py-8 text-secondary-500">
            No competitor data available for this company.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
