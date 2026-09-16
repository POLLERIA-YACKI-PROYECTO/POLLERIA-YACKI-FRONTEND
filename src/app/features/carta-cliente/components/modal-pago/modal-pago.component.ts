// src/app/features/carta-cliente/components/modal-pago/modal-pago.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnChanges,
  SimpleChanges,
  inject,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfiguracionService } from '../../../../core/services/configuracion.service';

type EstadoPago =
  | 'formulario'
  | 'creando'
  | 'qr_yape_plin'
  | 'qr_izipay'
  | 'maquina_izipay'
  | 'efectivo_caja'
  | 'exitoso'
  | 'error';

type MetodoPago = 'efectivo' | 'yape' | 'plin' | 'transferencia' | 'tarjeta';

@Component({
  selector: 'app-modal-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-pago.component.html',
  styleUrls: ['./modal-pago.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalPagoComponent implements OnInit, OnChanges, OnDestroy {
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private configService = inject(ConfiguracionService); // ✅ NUEVO

  private destroy$ = new Subject<void>();

  @Input() visible = false;
  @Input() total = 0;
  @Input() cargando = false;
  @Input() pedidoId: number | null = null;
  @Input() numeroYape: string = '902458936';
  @Input() numeroPlin: string = '902458936';

  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<any>();
  @Output() subirComprobante = new EventEmitter<{ pedidoId: number; archivo: File }>();
  @Output() confirmarEfectivoCaja = new EventEmitter<{ pedidoId: number }>();
  @Output() confirmarMaquina = new EventEmitter<{ pedidoId: number }>();

  metodoPago = signal<MetodoPago>('efectivo');
  clienteNombre = signal('');
  telefono = signal('');
  direccion = signal('');
  referencia = signal('');
  observaciones = signal('');
  tipoEntrega = signal('delivery');
  estadoPago = signal<EstadoPago>('formulario');
  mensajeError = signal('');
  qrDataUrl = signal<string>('');

  tipoTransferencia = signal<'qr' | 'maquina'>('qr');

  comprobanteArchivo = signal<File | null>(null);
  comprobantePreview = signal<string>('');

  // ✅ NUEVO: Configuración dinámica del backend
  config = signal<Record<string, any>>({});
  configCargada = signal<boolean>(false);

  private iconCache: Record<string, SafeHtml> = {};
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  metodosPago = [
    { id: 'efectivo' as MetodoPago, label: 'Efectivo', sub: 'Pagar en caja', icon: 'efectivo' },
    { id: 'yape' as MetodoPago, label: 'Yape', sub: 'QR', icon: 'yape' },
    { id: 'plin' as MetodoPago, label: 'Plin', sub: 'QR', icon: 'plin' },
    { id: 'transferencia' as MetodoPago, label: 'Transferencia', sub: 'QR / POS', icon: 'transferencia' },
    { id: 'tarjeta' as MetodoPago, label: 'Tarjeta', sub: 'Izipay', icon: 'tarjeta' }
  ];

  // ============================================
  // CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    // ✅ Cargar configuración del backend al iniciar
    this.cargarConfiguracion();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pedidoId'] && this.pedidoId) {
      this.onPedidoCreado(this.pedidoId);
      return;
    }

    if (changes['visible'] && this.visible) {
      if (this.pedidoId) {
        this.onPedidoCreado(this.pedidoId);
      } else {
        this.resetEstado();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // ✅ CARGAR CONFIGURACIÓN DEL BACKEND
  // ============================================
  private cargarConfiguracion(): void {
    this.configService
      .obtenerPublicas()
      .pipe(
        catchError((err) => {
          console.warn('[ModalPago] No se pudo cargar configuración:', err);
          return of({ success: false, config: {} });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          const config = res?.config || {};
          this.config.set(config);
          this.configCargada.set(true);

          // Actualizar números si vienen del backend
          if (config.YAPE_NUMERO) this.numeroYape = String(config.YAPE_NUMERO);
          if (config.PLIN_NUMERO) this.numeroPlin = String(config.PLIN_NUMERO);

          console.log('✅ [ModalPago] Configuración cargada:', {
            yapeNumero: config.YAPE_NUMERO,
            plinNumero: config.PLIN_NUMERO,
            tieneYapeQr: !!config.YAPE_QR,
            tienePlinQr: !!config.PLIN_QR,
            tieneIzipayQr: !!config.IZIPAY_QR
          });
        }
      });
  }

  // ============================================
  // GETTERS DE ESTADO
  // ============================================
  get mostrarFormulario(): boolean { return this.estadoPago() === 'formulario'; }
  get mostrarCreando(): boolean { return this.estadoPago() === 'creando'; }
  get mostrarQRYapePlin(): boolean { return this.estadoPago() === 'qr_yape_plin'; }
  get mostrarQRIzipay(): boolean { return this.estadoPago() === 'qr_izipay'; }
  get mostrarMaquinaIzipay(): boolean { return this.estadoPago() === 'maquina_izipay'; }
  get mostrarEfectivoCaja(): boolean { return this.estadoPago() === 'efectivo_caja'; }
  get mostrarExitoso(): boolean { return this.estadoPago() === 'exitoso'; }
  get mostrarError(): boolean { return this.estadoPago() === 'error'; }

  get esYape(): boolean { return this.metodoPago() === 'yape'; }
  get esPlin(): boolean { return this.metodoPago() === 'plin'; }
  get esTransferencia(): boolean { return this.metodoPago() === 'transferencia'; }
  get esEfectivo(): boolean { return this.metodoPago() === 'efectivo'; }

  // ============================================
  // ✅ GETTERS DE CONFIGURACIÓN (QR dinámico)
  // ============================================
  get titularYape(): string {
    return this.config()['YAPE_TITULAR'] || '';
  }

  get titularPlin(): string {
    return this.config()['PLIN_TITULAR'] || '';
  }

  get mensajeEfectivo(): string {
    return this.config()['EFECTIVO_MENSAJE'] ||
      'Paga en caja y el cajero confirmará tu pedido';
  }

  get comercioIzipay(): string {
    return this.config()['IZIPAY_COMERCIO'] || '';
  }

  get tarjetaIzipay(): string {
    return this.config()['TARJETA_IZIPAY'] || '';
  }

  // ✅ URL del QR de Yape subido por el admin
  get yapeQrUrl(): string {
    const valor = this.config()['YAPE_QR'];
    if (!valor) return '';
    return this.configService.getImagenConfigUrl(valor);
  }

  // ✅ URL del QR de Plin subido por el admin
  get plinQrUrl(): string {
    const valor = this.config()['PLIN_QR'];
    if (!valor) return '';
    return this.configService.getImagenConfigUrl(valor);
  }

  // ✅ URL del QR de Izipay subido por el admin
  get izipayQrUrl(): string {
    const valor = this.config()['IZIPAY_QR'];
    if (!valor) return '';
    return this.configService.getImagenConfigUrl(valor);
  }

  // ✅ Decide qué mostrar: QR subido o QR generado
  get qrMostrar(): string {
    const metodo = this.metodoPago();

    if (metodo === 'yape' && this.yapeQrUrl) return this.yapeQrUrl;
    if (metodo === 'plin' && this.plinQrUrl) return this.plinQrUrl;
    if (metodo === 'transferencia' && this.izipayQrUrl) return this.izipayQrUrl;

    // Fallback: el QR generado por SVG
    return this.qrDataUrl();
  }

  // ✅ ¿El método actual tiene QR subido?
  get tieneQrSubido(): boolean {
    const metodo = this.metodoPago();

    if (metodo === 'yape') return !!this.yapeQrUrl;
    if (metodo === 'plin') return !!this.plinQrUrl;
    if (metodo === 'transferencia') return !!this.izipayQrUrl;

    return false;
  }

  // ============================================
  // RESET
  // ============================================
  resetEstado(): void {
    const cliente = this.authService.getUsuarioActual() || {};

    this.estadoPago.set('formulario');
    this.mensajeError.set('');
    this.qrDataUrl.set('');
    this.tipoTransferencia.set('qr');
    this.comprobanteArchivo.set(null);
    this.comprobantePreview.set('');
    this.clienteNombre.set(cliente.nombre || '');
    this.telefono.set(cliente.telefono || '');
    this.direccion.set(cliente.direccion || '');
    this.referencia.set('');
    this.observaciones.set('');
  }

  formatearPrecio(precio: number | string): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    if (isNaN(num)) return 'S/ 0.00';
    return `S/ ${num.toFixed(2)}`;
  }

  // ============================================
  // SUBMIT
  // ============================================
  onSubmit(): void {
    if (this.cargando) return;

    if (!this.metodoPago()) {
      alert('Por favor selecciona un método de pago');
      return;
    }

    if (this.tipoEntrega() === 'delivery' && !this.direccion().trim()) {
      alert('Debes ingresar la dirección para delivery.');
      return;
    }

    this.estadoPago.set('creando');

    this.confirmar.emit({
      metodo: this.metodoPago(),
      clienteNombre: this.clienteNombre() || 'Cliente',
      telefono: this.telefono(),
      direccion: this.direccion(),
      referencia: this.referencia(),
      observaciones: this.observaciones(),
      tipoEntrega: this.tipoEntrega(),
      total: this.total,
      tipoTransferencia: this.esTransferencia ? this.tipoTransferencia() : null
    });
  }

  // ============================================
  // CUANDO EL PADRE CREA EL PEDIDO
  // ============================================
  private onPedidoCreado(pedidoId: number): void {
    const metodo = this.metodoPago();

    switch (metodo) {
      case 'efectivo':
        this.estadoPago.set('efectivo_caja');
        break;

      case 'yape':
      case 'plin':
        // ✅ Si hay QR subido, usarlo; si no, generar uno
        if (this.tieneQrSubido) {
          this.estadoPago.set('qr_yape_plin');
        } else {
          this.generarQRYapePlin();
          this.estadoPago.set('qr_yape_plin');
        }
        break;

      case 'transferencia':
        if (this.tipoTransferencia() === 'qr') {
          if (this.izipayQrUrl) {
            this.estadoPago.set('qr_izipay');
          } else {
            this.generarQRIzipay();
            this.estadoPago.set('qr_izipay');
          }
        } else {
          this.estadoPago.set('maquina_izipay');
        }
        break;

      case 'tarjeta':
        this.estadoPago.set('maquina_izipay');
        break;

      default:
        this.estadoPago.set('exitoso');
    }
  }

  // ============================================
  // GENERAR QR (fallback si no hay QR subido)
  // ============================================
  private generarQRYapePlin(): void {
    const metodo = this.metodoPago();
    const numero = metodo === 'yape' ? this.numeroYape : this.numeroPlin;
    const nombre = metodo === 'yape' ? 'Yape' : 'Plin';
    const color = metodo === 'yape' ? '#6E00A0' : '#00C3B4';

    const svg = this.generarQRSVG(nombre, numero, color);
    this.qrDataUrl.set(svg);
  }

  private generarQRIzipay(): void {
    const svg = this.generarQRSVG('Izipay', 'Transferencia', '#F58220');
    this.qrDataUrl.set(svg);
  }

  private generarQRSVG(nombre: string, numero: string, color: string): string {
    const tamano = 25;
    const celda = 8;
    const padding = 40;
    const dimension = tamano * celda + padding * 2;

    let celdas = '';
    const semilla = this.hashCode(numero + nombre);

    for (let y = 0; y < tamano; y++) {
      for (let x = 0; x < tamano; x++) {
        const esEsquinaTL = x < 7 && y < 7;
        const esEsquinaTR = x >= tamano - 7 && y < 7;
        const esEsquinaBL = x < 7 && y >= tamano - 7;

        let relleno = false;

        if (esEsquinaTL || esEsquinaTR || esEsquinaBL) {
          const lx = esEsquinaTR ? x - (tamano - 7) : x;
          const ly = esEsquinaBL ? y - (tamano - 7) : y;
          const enBorde = lx === 0 || lx === 6 || ly === 0 || ly === 6;
          const enCentro = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
          relleno = enBorde || enCentro;
        } else {
          const valor = (semilla + x * 7 + y * 13) % 3;
          relleno = valor === 0;
        }

        if (relleno) {
          celdas += `<rect x="${padding + x * celda}" y="${padding + y * celda}" width="${celda}" height="${celda}" fill="#000000"/>`;
        }
      }
    }

    const centroX = dimension / 2;
    const centroY = dimension / 2;
    const logoSize = 100;

    const logo = `
      <rect x="${centroX - logoSize / 2 - 8}" y="${centroY - logoSize / 2 - 8}" 
            width="${logoSize + 16}" height="${logoSize + 16}" 
            fill="#ffffff" rx="12"/>
      <rect x="${centroX - logoSize / 2}" y="${centroY - logoSize / 2}" 
            width="${logoSize}" height="${logoSize}" 
            fill="${color}" rx="10"/>
      <text x="${centroX}" y="${centroY + 8}" 
            font-family="Arial, sans-serif" font-size="20" font-weight="bold" 
            fill="#ffffff" text-anchor="middle">${nombre}</text>
    `;

    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension + 60}" width="100%" height="100%">
        <rect width="${dimension}" height="${dimension + 60}" fill="#ffffff"/>
        <rect x="20" y="20" width="${dimension - 40}" height="${dimension - 40}" fill="#ffffff" rx="20" stroke="${color}" stroke-width="2"/>
        ${celdas}
        ${logo}
        <text x="${dimension / 2}" y="${dimension + 25}" 
              font-family="Arial, sans-serif" font-size="15" font-weight="bold" 
              fill="${color}" text-anchor="middle">${nombre} · ${numero}</text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // ============================================
  // ✅ MANEJO DE ERROR DE QR
  // ============================================
  manejarErrorQr(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallbackAplicado'] === 'true') return;
    img.dataset['fallbackAplicado'] = 'true';
    // Si falla el QR subido, usar el generado por SVG
    const generado = this.qrDataUrl();
    if (generado) {
      img.src = generado;
    }
  }

  // ============================================
  // COMPROBANTE
  // ============================================
  onComprobanteSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];

    if (archivo.size > 5 * 1024 * 1024) {
      alert('El archivo no debe superar los 5MB');
      return;
    }

    if (!/image\/(jpeg|jpg|png|webp)|application\/pdf/.test(archivo.type)) {
      alert('Solo se permiten imágenes o PDF');
      return;
    }

    this.comprobanteArchivo.set(archivo);

    if (archivo.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.comprobantePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(archivo);
    } else {
      this.comprobantePreview.set('');
    }
  }

  quitarComprobante(): void {
    this.comprobanteArchivo.set(null);
    this.comprobantePreview.set('');
  }

  confirmarConComprobante(): void {
    const archivo = this.comprobanteArchivo();
    if (!archivo) {
      alert('Debes adjuntar el comprobante de pago');
      return;
    }
    if (!this.pedidoId) {
      alert('Error: No hay pedido asociado');
      return;
    }

    this.estadoPago.set('creando');

    this.subirComprobante.emit({
      pedidoId: this.pedidoId,
      archivo
    });
  }

  // ============================================
  // CONFIRMACIONES
  // ============================================
  confirmarEfectivo(): void {
    if (!this.pedidoId) return;
    this.estadoPago.set('exitoso');
    this.confirmarEfectivoCaja.emit({ pedidoId: this.pedidoId });
  }

  confirmarMaquinaIzipay(): void {
    if (!this.pedidoId) return;
    this.estadoPago.set('exitoso');
    this.confirmarMaquina.emit({ pedidoId: this.pedidoId });
  }

  // ============================================
  // CERRAR
  // ============================================
  cerrarModal(): void {
    if (this.cargando) return;
    this.resetEstado();
    this.cerrar.emit();
  }

  // ============================================
  // ERROR
  // ============================================
  pagoError(mensaje: string): void {
    this.estadoPago.set('error');
    this.mensajeError.set(mensaje || 'Error al procesar el pago');
  }

  reintentar(): void {
    this.resetEstado();
  }

  // ============================================
  // SVG DE ICONOS
  // ============================================
  getMetodoPagoSVG(metodo: string): SafeHtml {
    if (this.iconCache[metodo]) {
      return this.iconCache[metodo];
    }

    const icons: Record<string, string> = {
      efectivo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 10v4M18 10v4"/></svg>`,
      yape: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M8 12l3 3 5-6"/></svg>`,
      plin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 7v5l3 2"/></svg>`,
      transferencia: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M3 12h18"/><path d="M18 7l5 5-5 5"/><path d="M6 7l-5 5 5 5"/></svg>`,
      tarjeta: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="6" cy="15" r="1"/></svg>`
    };

    const safe = this.sanitizer.bypassSecurityTrustHtml(icons[metodo] || icons['efectivo']);
    this.iconCache[metodo] = safe;
    return safe;
  }
}