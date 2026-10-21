import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { datasetsApi } from '../../api/datasets';
import { analyticsApi } from '../../api/analytics';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
  Loader2,
  TrendingUp,
  Sliders,
  Check,
} from 'lucide-react';

export default function PredictionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(id || '');
  const [columns, setColumns] = useState([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [problemType, setProblemType] = useState('regression');
  const [modelType, setModelType] = useState('linear_regression');
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await datasetsApi.list({ page_size: 100 });
        setDatasets(res.items || []);
        if (!selectedDatasetId && res.items?.length > 0) {
          setSelectedDatasetId(res.items[0].id);
        }
      } catch (err) {
        console.error('Failed to load datasets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  const loadDatasetFeatures = async (targetId) => {
    if (!targetId) return;
    setErrorMsg('');
    try {
      const prev = await datasetsApi.getPreview(targetId, 5);
      const cols = prev.columns || [];
      setColumns(cols);
      if (cols.length > 0) {
        setTargetColumn(cols[cols.length - 1]);
        setSelectedFeatures(cols.slice(0, cols.length - 1));
      }
      const history = await analyticsApi.getPredictions(targetId);
      setPredictionHistory(history || []);
      if (history && history.length > 0) {
        setCurrentResult(history[0]);
      }
    } catch (err) {
      if (err.response?.status === 422) {
        setErrorMsg('Machine learning is locked until dataset passes manager validation.');
      }
    }
  };

  useEffect(() => {
    if (selectedDatasetId) {
      loadDatasetFeatures(selectedDatasetId);
      setCurrentResult(null);
    }
  }, [selectedDatasetId]);

  const handleTrain = async () => {
    if (!selectedDatasetId) return;
    setTraining(true);
    setErrorMsg('');
    try {
      const result = await analyticsApi.trainPrediction(selectedDatasetId, {
        target_column: targetColumn,
        features: selectedFeatures,
        problem_type: problemType,
        model_type: modelType,
      });
      setCurrentResult(result);
      loadDatasetFeatures(selectedDatasetId);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setTraining(false);
    }
  };

  if (loading) {
    return (
      <div data-page-theme="prediction" className="space-y-6">
        <div className="h-14 w-72 bg-white/80 border border-[var(--color-border)] rounded-2xl animate-pulse" />
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  const currentDataset = datasets.find((d) => String(d.id) === String(selectedDatasetId));

  const toggleFeature = (col) => {
    setSelectedFeatures((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  return (
    <div data-page-theme="prediction" className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Automated Machine Learning & Forecasting"
        subtitle="Automated Scikit-Learn pipelines with ColumnTransformer preprocessing, feature scaling, and benchmark comparison."
        breadcrumbs={[
          { label: 'Intelligence' },
          { label: 'Machine Learning Lab' },
          ...(currentDataset ? [{ label: currentDataset.name }] : []),
        ]}
        badge={
          <span className="badge badge-primary text-[11px] font-mono">
            ● Scikit-Learn Engine
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedDatasetId}
              onChange={(e) => {
                setSelectedDatasetId(e.target.value);
                navigate(`/datasets/${e.target.value}/predict`);
              }}
              className="input-field py-1.5 text-xs w-64 font-mono"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {errorMsg && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-sans animate-fade-in">
          {errorMsg}
        </div>
      )}

      {/* Model Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters Column */}
        <VelloraCard className="space-y-4">
          <SectionHeader
            title="Model Architecture"
            subtitle="Estimator & hyperparameter setup"
            icon={Cpu}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Problem Type
            </label>
            <select
              value={problemType}
              onChange={(e) => {
                setProblemType(e.target.value);
                setModelType(e.target.value === 'regression' ? 'linear_regression' : 'logistic_regression');
              }}
              className="input-field text-xs py-2 font-sans"
            >
              <option value="regression">Regression (Continuous Numeric)</option>
              <option value="classification">Classification (Categorical / Binary)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Algorithm / Estimator
            </label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="input-field text-xs py-2 font-mono"
            >
              {problemType === 'regression' ? (
                <>
                  <option value="linear_regression">Linear Regression</option>
                  <option value="decision_tree">Decision Tree Regressor</option>
                  <option value="random_forest">Random Forest Regressor (Ensemble)</option>
                </>
              ) : (
                <>
                  <option value="logistic_regression">Logistic Regression</option>
                  <option value="decision_tree">Decision Tree Classifier</option>
                  <option value="random_forest">Random Forest Classifier (Ensemble)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Target Column (y)
            </label>
            <select
              value={targetColumn}
              onChange={(e) => {
                setTargetColumn(e.target.value);
                setSelectedFeatures((prev) => prev.filter((c) => c !== e.target.value));
              }}
              className="input-field text-xs py-2 font-mono"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172554] uppercase tracking-wider mb-2 font-mono">
              Predictor Features (X)
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1.5 p-3 rounded-2xl bg-[#F2EEFF] border border-[#DCD4FF]">
              {columns
                .filter((c) => c !== targetColumn)
                .map((col) => (
                  <label key={col} className="flex items-center gap-2 text-xs text-[#43516A] hover:text-[#172554] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(col)}
                      onChange={() => toggleFeature(col)}
                      className="rounded border-[#DCD4FF] text-[#7665B5] focus:ring-[#7665B5]"
                    />
                    <span className="font-mono text-[11px] truncate text-[#172554]">{col}</span>
                  </label>
                ))}
            </div>
          </div>

          <button
            onClick={handleTrain}
            disabled={training || !selectedDatasetId || selectedFeatures.length === 0}
            className="btn-primary w-full text-xs mt-3 py-2.5"
          >
            {training ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                <span>Training Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1" />
                <span>Fit & Benchmark Estimator</span>
              </>
            )}
          </button>
        </VelloraCard>

        {/* Results & Evaluation Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {!currentResult ? (
            <EmptyState
              icon={Cpu}
              title="No model trained yet"
              description="Configure predictor features on the left and click Fit & Benchmark to train the model and inspect metrics."
            />
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Metrics Display */}
              <VelloraCard className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#172554] capitalize font-sans">
                      {currentResult.model_type?.replace('_', ' ')}
                    </h3>
                    <p className="text-xs text-[#718096] font-mono mt-0.5">
                      Target: {currentResult.target_column} &bull; {currentResult.features?.length} Features
                    </p>
                  </div>
                  <span className="badge badge-success text-xs font-mono">80/20 Test Split</span>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {currentResult.metrics?.mae !== undefined ? (
                    <>
                      <div className="p-3.5 rounded-2xl bg-[#F2EEFF] border border-[#DCD4FF]">
                        <span className="text-[10px] text-[#7665B5] font-bold uppercase tracking-wider block font-mono">MAE</span>
                        <span className="text-2xl font-bold text-[#172554] font-mono">
                          {currentResult.metrics.mae?.toFixed(3)}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#F2EEFF] border border-[#DCD4FF]">
                        <span className="text-[10px] text-[#7665B5] font-bold uppercase tracking-wider block font-mono">RMSE</span>
                        <span className="text-2xl font-bold text-[#172554] font-mono">
                          {currentResult.metrics.rmse?.toFixed(3)}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#F2EEFF] border border-[#DCD4FF]">
                        <span className="text-[10px] text-[#7665B5] font-bold uppercase tracking-wider block font-mono">R² Score</span>
                        <span className="text-2xl font-bold text-[#168F79] font-mono">
                          {currentResult.metrics.r2?.toFixed(3)}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#F2EEFF] border border-[#DCD4FF]">
                        <span className="text-[10px] text-[#7665B5] font-bold uppercase tracking-wider block font-mono">Holdout Rows</span>
                        <span className="text-2xl font-bold text-[#2563A6] font-mono">
                          {currentResult.predictions?.testing_rows ?? '—'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3.5 rounded-2xl bg-[#F2EEFF] border border-[#DCD4FF]">
                        <span className="text-[10px] text-[#7665B5] font-bold uppercase tracking-wider block font-mono">Accuracy</span>
                        <span className="text-2xl font-bold text-[#168F79] font-mono">
                          {(currentResult.metrics.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#F2EEFF] border border-[#DCD4FF]">
                        <span className="text-[10px] text-[#7665B5] font-bold uppercase tracking-wider block font-mono">Precision</span>
                        <span className="text-2xl font-bold text-[#172554] font-mono">
                          {(currentResult.metrics.precision * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#F2EEFF] border border-[#DCD4FF]">
                        <span className="text-[10px] text-[#7665B5] font-bold uppercase tracking-wider block font-mono">Recall</span>
                        <span className="text-2xl font-bold text-[#172554] font-mono">
                          {(currentResult.metrics.recall * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#F2EEFF] border border-[#DCD4FF]">
                        <span className="text-[10px] text-[#7665B5] font-bold uppercase tracking-wider block font-mono">F1 Score</span>
                        <span className="text-2xl font-bold text-[#B7791F] font-mono">
                          {currentResult.metrics.f1?.toFixed(3)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </VelloraCard>

              {/* Multi-Model Benchmark Comparison Table */}
              {currentResult.predictions?.model_comparison?.length > 0 && (
                <VelloraCard className="space-y-4">
                  <SectionHeader
                    title="Algorithm Benchmark & Evaluation"
                    subtitle="Multi-model benchmark ranking across estimators"
                    icon={TrendingUp}
                  />
                  <div className="overflow-x-auto">
                    <table className="vellora-table font-mono text-xs">
                      <thead>
                        <tr>
                          <th>Model Estimator</th>
                          {currentResult.metrics?.mae !== undefined ? (
                            <>
                              <th>MAE</th>
                              <th>RMSE</th>
                              <th>R² Score</th>
                            </>
                          ) : (
                            <>
                              <th>Accuracy</th>
                              <th>Precision</th>
                              <th>Recall</th>
                              <th>F1 Score</th>
                            </>
                          )}
                          <th className="text-right">Rank Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentResult.predictions.model_comparison.map((mc, idx) => {
                          const isSelected = mc.model === currentResult.model_type;
                          return (
                            <tr key={idx} className={isSelected ? 'bg-[#F2EEFF] font-semibold' : ''}>
                              <td className="font-semibold text-[#172554]">{mc.label}</td>
                              {currentResult.metrics?.mae !== undefined ? (
                                <>
                                  <td className="text-[#172554]">{mc.metrics?.mae?.toFixed(3)}</td>
                                  <td className="text-[#43516A]">{mc.metrics?.rmse?.toFixed(3)}</td>
                                  <td className="text-[#168F79] font-bold">{mc.metrics?.r2?.toFixed(3)}</td>
                                </>
                              ) : (
                                <>
                                  <td className="text-[#168F79] font-bold">{(mc.metrics?.accuracy * 100).toFixed(1)}%</td>
                                  <td className="text-[#172554]">{(mc.metrics?.precision * 100).toFixed(1)}%</td>
                                  <td className="text-[#43516A]">{(mc.metrics?.recall * 100).toFixed(1)}%</td>
                                  <td className="text-[#B7791F] font-bold">{mc.metrics?.f1?.toFixed(3)}</td>
                                </>
                              )}
                              <td className="text-right">
                                {isSelected ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-[#DCD4FF] text-[#7665B5] border border-[#A99AE8]">
                                    Primary Fit
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#718096] font-mono">Benchmarked</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </VelloraCard>
              )}

              {/* Sample Predictions Table */}
              {currentResult.predictions?.sample && (
                <VelloraCard className="space-y-4">
                  <SectionHeader
                    title="Out-of-Sample Predictions"
                    subtitle="Actual vs predicted target comparison"
                    icon={Activity}
                  />
                  <div className="overflow-x-auto max-h-60">
                    <table className="vellora-table font-mono text-xs">
                      <thead>
                        <tr>
                          <th>Sample #</th>
                          <th>Actual Value</th>
                          <th>Predicted Value</th>
                          <th>Variance Delta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentResult.predictions.sample.slice(0, 15).map((row, idx) => {
                          const act = typeof row.actual === 'number' ? row.actual.toFixed(2) : String(row.actual);
                          const pred = typeof row.predicted === 'number' ? row.predicted.toFixed(2) : String(row.predicted);
                          return (
                            <tr key={idx}>
                              <td className="text-[var(--color-text-muted)]">{idx + 1}</td>
                              <td className="text-[var(--color-text)]">{act}</td>
                              <td className="text-[var(--color-primary)] font-semibold">{pred}</td>
                              <td className="text-[var(--color-text-secondary)]">
                                {typeof row.actual === 'number' && typeof row.predicted === 'number'
                                  ? Math.abs(row.actual - row.predicted).toFixed(2)
                                  : row.actual === row.predicted
                                  ? 'Match'
                                  : 'Mismatch'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </VelloraCard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
