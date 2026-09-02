// src/app/core/services/configuracion.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/configuracion`;

  obtenerConfiguracion(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  actualizarConfiguracion(clave: string, valor: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${clave}`, { valor });
  }
}
