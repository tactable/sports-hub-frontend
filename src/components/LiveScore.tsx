import React, { useCallback, useEffect, useState } from 'react';
import { fixturesApi, Fixture, FixtureStats } from '../services/api';
import './LiveScore.css';

const LiveScores = () => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [fixtureStats, setFixtureStats] = useState<FixtureStats[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamCleanup, setStreamCleanup] = useState<(() => void) | null>(null);

    // Load live fixtures
    const loadLiveFixtures = async (): Promise<void> => {
      stopStream();
      setSelectedFixture(null);
      setFixtureStats(null);
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
      setSelectedFixture(null);
      setFixtureStats(null);
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

    const handleFixtureClick = async (fixture: Fixture): Promise<void> => {
      setSelectedFixture(fixture);
      setStatsLoading(true);
      setError(null);
      try {
        const stats = await fixturesApi.getFixtureStats(fixture.id);
        if (Array.isArray(stats)) {
          setFixtureStats(stats);
        } else {
          throw new Error("Invalid stats data");
        }
      } catch (err) {
        setFixtureStats(null);
        setError("Failed to load fixture stats");
      } finally {
        setStatsLoading(false);
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
            onClick={() => handleFixtureClick(fixture)}
            style={{ cursor: 'pointer' }}
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
    {selectedFixture && (
      <div className="fixture-stats-modal">
        <h2>
          Stats for {selectedFixture.homeTeam} vs {selectedFixture.awayTeam}
        </h2>
        {statsLoading && <div>Loading stats...</div>}
        {!statsLoading && fixtureStats && fixtureStats.length === 2 ? (
          <table className="stats-table">
            <thead>
              <tr>
                <th>{selectedFixture.homeTeam}</th>
                <th>Team Stats</th>
                <th>{selectedFixture.awayTeam}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{fixtureStats[0]?.shotsOnGoal ?? 0}</td>
                <td>Shots on Goal</td>
                <td>{fixtureStats[1]?.shotsOnGoal ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.shotsOffGoal ?? 0}</td>
                <td>Shots off Goal</td>
                <td>{fixtureStats[1]?.shotsOffGoal ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.shotsInsideBox ?? 0}</td>
                <td>Shots inside box</td>
                <td>{fixtureStats[1]?.shotsInsideBox ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.shotsOutsideBox ?? 0}</td>
                <td>Shots outside box</td>
                <td>{fixtureStats[1]?.shotsOutsideBox ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.totalShots ?? 0}</td>
                <td>Total Shots</td>
                <td>{fixtureStats[1]?.totalShots ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.blockedShots ?? 0}</td>
                <td>Blocked Shots</td>
                <td>{fixtureStats[1]?.blockedShots ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.fouls ?? 0}</td>
                <td>Fouls</td>
                <td>{fixtureStats[1]?.fouls ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.cornerKicks ?? 0}</td>
                <td>Corner Kicks</td>
                <td>{fixtureStats[1]?.cornerKicks ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.offsides ?? 0}</td>
                <td>Offsides</td>
                <td>{fixtureStats[1]?.offsides ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.ballPossession ?? '0%'}</td>
                <td>Ball Possession</td>
                <td>{fixtureStats[1]?.ballPossession ?? '0%'}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.yellowCards ?? 0}</td>
                <td>Yellow Cards</td>
                <td>{fixtureStats[1]?.yellowCards ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.redCards ?? 0}</td>
                <td>Red Cards</td>
                <td>{fixtureStats[1]?.redCards ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.goalkeeperSaves ?? 0}</td>
                <td>Goalkeeper Saves</td>
                <td>{fixtureStats[1]?.goalkeeperSaves ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.totalPasses ?? 0}</td>
                <td>Total passes</td>
                <td>{fixtureStats[1]?.totalPasses ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.passesAccurate ?? 0}</td>
                <td>Passes accurate</td>
                <td>{fixtureStats[1]?.passesAccurate ?? 0}</td>
              </tr>
              <tr>
                <td>{fixtureStats[0]?.passesPercent ?? '0%'}</td>
                <td>Passes %</td>
                <td>{fixtureStats[1]?.passesPercent ?? '0%'}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div>No stats available for this fixture</div>
        )}
        <br></br>
        <button onClick={() => setSelectedFixture(null)}>Close</button>
      </div>
      )}
    </div>
  );
};

export default LiveScores;
