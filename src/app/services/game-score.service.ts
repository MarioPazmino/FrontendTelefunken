// src/app/services/game-score.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface PlayerScore {
  playerId: string;
  playerName: string;
  rounds: Array<{
    roundNumber: number;
    points: number;
    fichasUsadas: number;
    telefunken: boolean;
    timestamp: string;
  }>;
  totalScore: number;
  fichasGastadas: number;
  telefunkens: number;
  status: string;
}

export interface GameMatch {
  matchId: string;
  gameId: string;
  status: 'in_progress' | 'completed';
  currentRound: number;
  players: PlayerScore[];
  startedAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameScoreService {
  private apiUrl = 'http://ec2-3-145-55-21.us-east-2.compute.amazonaws.com:3000/api/v1/game-score';
  private currentMatchSubject = new BehaviorSubject<GameMatch | null>(null);
  currentMatch$ = this.currentMatchSubject.asObservable();

  constructor(private http: HttpClient) {}

  initializeGame(matchId: string, players: any[]): Observable<GameMatch> {
    return this.http.post<GameMatch>(`${this.apiUrl}/initialize`, { matchId, players })
      .pipe(
        tap(match => {
          console.log('Game initialized with matchId:', match.matchId);
          this.currentMatchSubject.next(match);  // ✅ Guardamos matchId
        })
      );
  }


  recordScore(matchId: string, playerId: string, roundData: {
    points: number;
    fichasUsadas: number;
    telefunken: boolean;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/record-score`, {
      matchId,
      playerId,
      roundData
    }).pipe(
      tap(result => {
        const currentMatch = this.currentMatchSubject.value;
        if (currentMatch) {
          // Actualizar el estado local
          this.getMatchStatus(matchId).subscribe();
        }
      })
    );
  }

  getMatchStatus(matchId: string): Observable<GameMatch> {
    return this.http.get<GameMatch>(`${this.apiUrl}/match/${matchId}`)
      .pipe(
        tap(match => this.currentMatchSubject.next(match))
      );
  }
}
