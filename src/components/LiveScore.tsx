import React, { useCallback, useEffect, useState } from 'react';
import { fixturesApi, Fixture } from '../services/api';
import './LiveScore.css';

const LiveScores = () => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamCleanup, setStreamCleanup] = useState<(() => void) | null>(null);

    // Load live fixtures
    const loadLiveFixtures = async (): Promise<void> => {
      stopStream();
      setLoading(true);
      setError(null);
      try {
        const data = await fixturesApi.getLiveFixtures();
        setFixtures(data);
      } catch (err) {
        setError("Failed to load live fixtures");
      } finally {
        setLoading(false);
      }
    };

    // Load today's fixtures
    const loadTodayFixtures = async (): Promise<void> => {
      stopStream();
      setLoading(true);
      setError(null);
      try {
        const data = await fixturesApi.getTodayFixtures();
        setFixtures(data);
      } catch (err) {
        setError("Failed to load today's fixtures");
      } finally {
        setLoading(false);
      }
    };

    // Start streaming
    const startStream = () => {
      setIsStreaming(true);

      const cleanup = fixturesApi.streamLiveFixtures(
        (data: Fixture[]) => {
          setFixtures(data);
          setError(null);
          setLoading(false);
        },
        (err: Event) => {
          setError("Streaming error occurred");
          setIsStreaming(false);
          setLoading(false);
        }
      );
      setStreamCleanup(cleanup);
    };

    // Stop streaming
    const stopStream = useCallback((): void => {
      if (streamCleanup) {
        streamCleanup();
        setStreamCleanup(null);
      }
      setIsStreaming(false);
      }, [streamCleanup]);

    // Load today's fixtures on component mount
    useEffect(() => {
      loadTodayFixtures();
    }, []);
    
    // Cleanup on unmount
    useEffect(() => {
      return () => stopStream();
    }, [stopStream]);
    
    const getFixtureStatus = (statusShort: string): string => {
      if (['1H', '2H', 'HT', 'ET', 'P'].includes(statusShort)) return 'live';
      if (['FT', 'AET', 'PEN'].includes(statusShort)) return 'finished';
      return 'scheduled';
    };

    const getStatusText = (fixture: Fixture): string => {
      const statusMap: Record<string, string> = {
        '1H': `${fixture.elapsed}' - First Half`,
        '2H': `${fixture.elapsed}' - Second Half`,
        'HT': 'Half Time',
        'FT': 'Full Time',
        'ET': `${fixture.elapsed}' - Extra Time`,
        'P': 'Penalties',
        'AET': 'After Extra Time',
        'PEN': 'Penalties Finished',
        'NS': 'Not Started',
        'PST': 'Postponed',
        'CANC': 'Cancelled'
      };
      return statusMap[fixture.statusShort] || fixture.status;
    };

  return (
    <div className="live-scores-container">
      <header>
        <h1>⚽ Live Football Scores</h1>
      </header>

      <div className="controls">
        <button onClick={loadLiveFixtures} disabled={loading}>
          🔴 Live Fixtures
        </button>
        <button onClick={loadTodayFixtures} disabled={loading}>
          📅 Today's Fixtures
        </button>
        <button onClick={startStream} disabled={isStreaming || loading}>
          📡 Auto-Update
        </button>
        <button onClick={stopStream} disabled={!isStreaming}>
          ⏹️ Stop Updates
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      
      {isStreaming && (
        <div className="status streaming">
          🔴 Live stream active (updates every 60s)
        </div>
      )}

      {loading && <div className="loading">Loading fixtures...</div>}

      {!loading && fixtures.length === 0 && (
        <div className="no-fixtures">No fixtures found</div>
      )}

      <div className="fixtures-grid">
        {fixtures.map((fixture) => (
          <div 
            key={fixture.id} 
            className={`fixture-card ${fixture.live ? 'live' : ''}`}
          >

            <div className="teams">
              <div className="team">
                <div className="team-name" > {fixture.homeTeam}</div>
                <div className="score">{fixture.homeScore}</div>
              </div>
              <div className="vs"><br></br>-</div>
              <div className="team">
                <div className="team-name">{fixture.awayTeam}</div>
                <div className="score">{fixture.awayScore}</div>
              </div>
            </div>

            <div className={`fixture-status ${getFixtureStatus(fixture.statusShort)}`}>
              {fixture.live && <span className="live-indicator"></span>}
              {getStatusText(fixture)}
            </div>
            <div className="league-info">
              <span className="league-name">{fixture.leagueName}</span>
              <span className="country" style={{ textAlign: "right" }}>{fixture.country}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveScores;
