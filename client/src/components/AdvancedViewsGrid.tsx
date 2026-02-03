import React, { useMemo } from 'react';
import { NoemaChartCanvas } from '@/noemaviz/integrate/NoemaChartCanvas';
import { DataFrame } from '@/noemaviz/core/data_engine';
import { generateViews, profileDataset } from '@/noemaviz/views/factory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdvancedViewsGridProps {
    data: any[];
}

export const AdvancedViewsGrid: React.FC<AdvancedViewsGridProps> = ({ data }) => {
    const { dataFrame, views, profile } = useMemo(() => {
        if (!data || data.length === 0) {
            return { dataFrame: null, views: [], profile: null };
        }

        const df = DataFrame.fromObjects(data);
        const prof = profileDataset(df);
        const viewSpecs = generateViews(df);

        return { dataFrame: df, views: viewSpecs, profile: prof };
    }, [data]);

    if (!dataFrame || views.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
                <p className="text-sm">No advanced analytics available for this dataset.</p>
                <p className="text-xs mt-2">
                    Requires numeric columns for statistical analysis.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Data Profile Summary */}
            <Card className="bg-muted/30 border-muted">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Dataset Profile</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Numeric</div>
                        <div className="text-lg font-semibold">{profile?.numericColumns.length || 0}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Categorical</div>
                        <div className="text-lg font-semibold">{profile?.categoricalColumns.length || 0}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Temporal</div>
                        <div className="text-lg font-semibold">{profile?.datetimeColumns.length || 0}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Views Generated</div>
                        <div className="text-lg font-semibold text-primary">{views.length}</div>
                    </div>
                </CardContent>
            </Card>

            {/* Advanced Views Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {views.map((spec, idx) => (
                    <Card key={spec.id || idx} className="overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                {spec.layout?.title || `View ${idx + 1}`}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {getViewDescription(spec.mark, spec.id)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="h-[280px] w-full">
                                <NoemaChartCanvas
                                    spec={spec}
                                    data={dataFrame}
                                    className="w-full h-full"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

function getViewDescription(mark: string, viewId: string): string {
    if (viewId.includes('distribution')) {
        return 'Log-scaled histogram with outlier detection using quantile analysis';
    }
    if (viewId.includes('dependencies')) {
        return 'Variable relationships ranked by mutual information strength';
    }
    if (viewId.includes('time_anomaly')) {
        return 'Changepoint detection highlights significant temporal shifts';
    }
    if (viewId.includes('geo_heatmap')) {
        return 'Geographic density visualization with adaptive binning';
    }
    if (viewId.includes('pca_embedding')) {
        return '2D projection reveals latent structure in high-dimensional data';
    }
    if (viewId.includes('cohort')) {
        return 'Statistical comparison between selected subset and remainder';
    }
    return 'AI-generated statistical visualization';
}
