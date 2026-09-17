// src/app/features/admin/configuracion/configuracion-modal.component.ts
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  signal,
  inject,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { ConfiguracionService } from '../../../core/services/configuracion.service';
import { NotificationService } from '../../../core/services/notificacion.service';

type TabConfig = 'empresa' | 'pagos' | 'horarios';

@Component({
  selector: 'app-configuracion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion-modal.component.html',
  styleUrls: ['./configuracion-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionModalComponent implements OnInit, OnDestroy {
  private configService = inject(ConfiguracionService);
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  @Input() visible = false;
  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('inputYapeQr') inputYapeQr?: ElementRef<HTMLInputElement>;
  @ViewChild('inputPlinQr') inputPlinQr?: ElementRef<HTMLInputElement>;
  @ViewChild('inputIzipayQr') inputIzipayQr?: ElementRef<HTMLInputElement>;

  tabActiva = signal<TabConfig>('empresa');
  cargando = signal(true);
  guardando = signal(false);
  subiendoImagen = signal<string | null>(null);

  // Datos del formulario
  form = signal<Record<string, any>>({
    EMPRESA_NOMBRE: '',
    EMPRESA_RUC: '',
    EMPRESA_DIRECCION: '',
    EMPRESA_TELEFONO: '',
    IGV: 18,
    MONEDA_SIMBOLO: 'S/',
    INSTAGRAM: '',
    FACEBOOK: '',
    TIKTOK: '',
    DELIVERY_TELEFONO: '',
    DELIVERY_COSTO: 0,
    HORARIO_APERTURA: '10:00',
    HORARIO_CIERRE: '22:00',
    DIAS_LABORALES: [],
    TIEMPO_ESTIMADO_PREPARACION: 30,
    YAPE_NUMERO: '',
    YAPE_TITULAR: '',
    YAPE_QR: '',
    PLIN_NUMERO: '',
    PLIN_TITULAR: '',
    PLIN_QR: '',
    IZIPAY_QR: '',
    IZIPAY_COMERCIO: '',
    TARJETA_IZIPAY: '',
    EFECTIVO_MENSAJE: 'Paga en caja y el cajero confirmará tu pedido',
  });

  // URLs de preview de QRs
  previewYapeQr = signal<string>('');
  previewPlinQr = signal<string>('');
  previewIzipayQr = signal<string>('');

  // Días de la semana (checkbox)
  diasSemana = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  ];

  cacheBuster = signal<number>(Date.now());

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Se llama cuando el padre abre/cierra el modal
  onVisibleChange(): void {
    if (this.visible) {
      this.cargarConfiguracion();
    }
  }

  // ============================================
  // CARGAR
  // ============================================
  cargarConfiguracion(): void {
    this.cargando.set(true);
    this.cacheBuster.set(Date.now());

    this.configService
      .obtenerConfiguracion(true)
      .pipe(
        catchError((err) => {
          console.error('Error al cargar configuración:', err);
          this.notificationService.error(
            'No se pudo cargar la configuración.',
            'Error'
          );
          return of({ success: false, config: {} });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          const config = res?.config || {};

         this.form.update((prev) => ({
  ...prev,
  ...config,
  DIAS_LABORALES: Array.isArray(config.DIAS_LABORALES)
    ? config.DIAS_LABORALES
    : prev['DIAS_LABORALES'],   // ⬅️ ACCESO CON CORCHETES
}));

          // Previews de QRs
          this.previewYapeQr.set(this.buildQrUrl(config.YAPE_QR));
          this.previewPlinQr.set(this.buildQrUrl(config.PLIN_QR));
          this.previewIzipayQr.set(this.buildQrUrl(config.IZIPAY_QR));

          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  private buildQrUrl(valor: string | null | undefined): string {
    if (!valor) return '';
    return this.configService.getImagenConfigUrl(valor, this.cacheBuster());
  }

  // ============================================
  // GUARDAR (batch)
  // ============================================
  guardar(): void {
    if (this.guardando()) return;

    this.guardando.set(true);

    const data = this.form();

    this.configService
      .actualizarConfiguracion(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success(
            'Configuración guardada correctamente.',
            'Guardado'
          );
          this.guardando.set(false);
          this.cerrarModal();
        },
        error: (err) => {
          let mensaje = 'No se pudo guardar la configuración.';
          if (err?.status === 401) mensaje = 'Sesión expirada.';
          else if (err?.status === 403) mensaje = 'No tienes permisos.';
          else if (err?.error?.error) mensaje = err.error.error;
          this.notificationService.error(mensaje, 'Error');
          this.guardando.set(false);
        },
      });
  }

  // ============================================
  // SUBIR IMAGEN (QR)
  // ============================================
  onSubirImagen(clave: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.notificationService.error('El archivo debe ser una imagen.', 'Formato inválido');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.error('La imagen no debe superar 5 MB.', 'Muy grande');
      input.value = '';
      return;
    }

    this.subiendoImagen.set(clave);

    this.configService
      .subirImagen(clave, file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const nuevaUrl = res?.url
            ? this.configService.getImagenConfigUrl(res.archivo, Date.now())
            : '';

          this.form.update((prev) => ({ ...prev, [clave]: res.archivo }));

          if (clave === 'YAPE_QR') this.previewYapeQr.set(nuevaUrl);
          if (clave === 'PLIN_QR') this.previewPlinQr.set(nuevaUrl);
          if (clave === 'IZIPAY_QR') this.previewIzipayQr.set(nuevaUrl);

          this.subiendoImagen.set(null);
          this.notificationService.success('QR subido correctamente.', 'Imagen subida');
          input.value = '';
        },
        error: () => {
          this.subiendoImagen.set(null);
          this.notificationService.error('No se pudo subir la imagen.', 'Error');
          input.value = '';
        },
      });
  }

  onEliminarImagen(clave: string): void {
    if (!confirm('¿Eliminar la imagen del QR?')) return;

    this.subiendoImagen.set(clave);

    this.configService
      .eliminarImagen(clave)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.form.update((prev) => ({ ...prev, [clave]: '' }));

          if (clave === 'YAPE_QR') this.previewYapeQr.set('');
          if (clave === 'PLIN_QR') this.previewPlinQr.set('');
          if (clave === 'IZIPAY_QR') this.previewIzipayQr.set('');

          this.subiendoImagen.set(null);
          this.notificationService.info('QR eliminado.', 'Eliminado');
        },
        error: () => {
          this.subiendoImagen.set(null);
          this.notificationService.error('No se pudo eliminar.', 'Error');
        },
      });
  }

  // ============================================
  // UTILIDADES
  // ============================================
  toggleDia(dia: string): void {
    this.form.update((prev) => {
      const dias = Array.isArray(prev['DIAS_LABORALES'])
        ? [...prev['DIAS_LABORALES']]
        : [];
      const idx = dias.indexOf(dia);

      if (idx >= 0) dias.splice(idx, 1);
      else dias.push(dia);

      return { ...prev, DIAS_LABORALES: dias };
    });
  }

  tieneDia(dia: string): boolean {
    const dias = this.form()['DIAS_LABORALES'];
    return Array.isArray(dias) && dias.includes(dia);
  }

  setTab(tab: TabConfig): void {
    this.tabActiva.set(tab);
  }

  cerrarModal(): void {
    if (this.guardando()) return;
    this.cerrar.emit();
  }

  // ============================================
  // ACTUALIZAR CAMPOS DEL FORM
  // ============================================
  updateField(clave: string, valor: any): void {
    this.form.update((prev) => ({ ...prev, [clave]: valor }));
  }
}