import { AppLayout } from "../components/layout/app-layout";
import { CompetitorComparison } from "../components/companies/competitor-comparison";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  Building,
  Users,
  RefreshCw,
  Database,
  Globe,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyApi } from "../lib/api";
import { useToast } from "../hooks/use-toast";

const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  type: z.enum(["partner", "client", "sub"], {
    required_error: "Please select a company type",
  }),
  domain: z.string().optional(),
  parentId: z.string().optional(),
});

type CreateCompanyForm = z.infer<typeof createCompanySchema>;

export default function Companies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [setIsCreateDialogOpen] = useState(false);
  const [dataSource, setDataSource] = useState<"local" | "airtable">("local");
  const [setIsRefreshing] = useState(false);
  const [expandedReports, setExpandedReports] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: airtableCompanies = [], refetch: refetchAirtable } = useQuery({
    queryKey: ["/api/companies/airtable"],
    enabled: dataSource === "airtable",
  });

  // Fetch rendering reports from Airtable to show competitor data
  const {
    data: renderingReports = [],
    isLoading: isLoadingReports,
    refetch: refetchRenderingReports,
  } = useQuery({
    queryKey: ["/api/rendering-reports/airtable"],
    enabled: true, // Always fetch rendering reports to show competitor data
  });

  const createCompanyForm = useForm<CreateCompanyForm>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: "",
      type: "client",
      domain: "",
      parentId: "",
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: companyApi.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Company created",
        description: "New company has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      createCompanyForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create company",
        variant: "destructive",
      });
    },
  });

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId],
    );
  };

  const displayCompanies =
    dataSource === "airtable" ? airtableCompanies : companies;

  return (
    <AppLayout
      title="Company Management"
      subtitle="Manage companies and organizational structure"
    >
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-companies"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48" data-testid="select-type-filter">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="sub">Sub-company</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>

      {/* Company Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Total Client Companies
                </p>
                <p className="text-2xl font-semibold text-secondary-900">
                  {renderingReports?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                <Building className="text-primary-500 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Partner Companies
                </p>
                <p className="text-2xl font-semibold text-secondary-900">
                  {
                    (displayCompanies as any[]).filter(
                      (c: any) => c.type === "partner",
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Building className="text-orange-500 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Sub-companies
                </p>
                <p className="text-2xl font-semibold text-secondary-900">
                  {
                    (displayCompanies as any[]).filter(
                      (c: any) => c.type === "sub",
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building className="text-blue-500 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dedicated section for Airtable Rendering Reports - Show all companies from Airtable */}
      {renderingReports && renderingReports.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                Competitor Analysis Reports
              </h2>
              <p className="text-secondary-600">
                All companies with competitors
              </p>
            </div>
            <Button
              onClick={() => refetchRenderingReports()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={isLoadingReports}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingReports ? "animate-spin" : ""}`}
              />
              Refresh Reports
            </Button>
          </div>

          <div className="space-y-2">
            {renderingReports.map((report: any) => {
              const isExpanded = expandedReports.includes(report.id);

              // Parse competitor scores if it's a JSON string
              let competitorScores = [];
              try {
                competitorScores =
                  typeof report.competitorScores === "string"
                    ? JSON.parse(report.competitorScores)
                    : report.competitorScores || [];
              } catch (e) {
                competitorScores = [];
              }

              // Generate company initials for avatar
              const getInitials = (name: string) => {
                return name
                  .split(" ")
                  .map((word) => word.charAt(0))
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
              };

              return (
                <div
                  key={report.id}
                  className="bg-white border border-border/60 rounded-lg"
                  data-testid={`report-card-${report.id}`}
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleReportExpansion(report.id)}
                    data-testid={`report-toggle-${report.id}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Company Avatar */}
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold text-sm border">
                        {getInitials(report.companyName)}
                      </div>

                      {/* Company Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3
                            className="text-lg font-semibold text-gray-900"
                            data-testid={`report-company-name-${report.id}`}
                          >
                            {report.companyName}
                          </h3>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Client
                          </Badge>
                        </div>

                        {report.website && (
                          <div
                            className="text-sm text-gray-600"
                            data-testid={`report-url-${report.id}`}
                          >
                            {report.website.replace(/^https?:\/\//, "")}
                          </div>
                        )}
                      </div>

                      {/* Created Date */}
                      {report.createdTime && (
                        <div
                          className="text-sm text-gray-600"
                          data-testid={`report-date-${report.id}`}
                        >
                          Created:{" "}
                          {new Date(report.createdTime).toLocaleDateString()}
                        </div>
                      )}

                      {/* Expand/Collapse Icon */}
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="pt-4 space-y-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge
                            variant="secondary"
                            data-testid={`report-traffic-${report.id}`}
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Traffic: {report.clientTraffic || "N/A"}
                          </Badge>
                          <Badge
                            variant="secondary"
                            data-testid={`report-keywords-${report.id}`}
                          >
                            <Globe className="h-3 w-3 mr-1" />
                            Keywords: {report.clientKeywords || "N/A"}
                          </Badge>
                          <Badge
                            variant="secondary"
                            data-testid={`report-backlinks-${report.id}`}
                          >
                            <Database className="h-3 w-3 mr-1" />
                            Backlinks: {report.clientBacklinks || "N/A"}
                          </Badge>
                        </div>

                        <CompetitorComparison
                          companyName={report.companyName}
                          clientTraffic={report.clientTraffic}
                          clientKeywords={report.clientKeywords}
                          clientBacklinks={report.clientBacklinks}
                          competitorScores={competitorScores}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
