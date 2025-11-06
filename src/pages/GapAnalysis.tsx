import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GapAnalysis() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/gap-analysis/frameworks', { replace: true });
  }, [navigate]);

  return null;
}