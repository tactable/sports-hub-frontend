import React, { useCallback, useEffect, useState } from 'react';
import { fixturesApi } from '../services/api';
import './LiveScore.css';

const LiveScores = () => {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamCleanup, setStreamCleanup] = useState(null);

    // Load live fixtures
    const loadLiveFixtures = async () => {
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
    const loadTodayFixtures = async () => {
      console.log("Loading today's fixtures");
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
      stopStream();
      setIsStreaming(true);

      const cleanup = fixturesApi.streamLiveFixtures(
        (data) => {
          setFixtures(data);
          setError(null);
        },
        (err) => {
          setError("Streaming error occurred");
          setIsStreaming(false);
        }
      );
      setStreamCleanup(() => cleanup);
    };

    // Stop streaming
    const stopStream = useCallback(
      () => {
      if (streamCleanup) {
        streamCleanup();
        setStreamCleanup(null);
      }
      setIsStreaming(false);
      }, [streamCleanup]);

    const getFixtureStatus = (statusShort) => {
      if (['1H', '2H', 'HT', 'ET', 'P'].includes(statusShort)) return 'live';
      if (['FT', 'AET', 'PEN'].includes(statusShort)) return 'finished';
      return 'scheduled';
    };

    const getStatusText = (fixture) => {
      const statusMap = {
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

    // Load today's fixtures on component mount
    useEffect(() => {
      loadTodayFixtures();
    }, []);
    
    // Cleanup on unmount
    useEffect(() => {
      return () => stopStream();
    }, [stopStream]);

  return (
    <div className="live-scores-container">
      <header>
        <h1>⚽ Live Football Scores</h1>
        <p className="subtitle">Real-time Fixture Updates</p>
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
              <div className="vs">-</div>
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
