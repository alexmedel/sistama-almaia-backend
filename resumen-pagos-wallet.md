# SpeedyGo — Módulo de Pagos y Wallet

Resumen del estado del trabajo. Todo funciona con datos dummy; nada está conectado a la API todavía.

---

## 1. Contexto del proyecto

**App:** `speedygo_app`, marketplace de servicios a domicilio. Clientes solicitan servicios y los ejecutan *fixers* (técnicos).

**Stack:**

| Área | Herramienta |
|---|---|
| Estado | `flutter_bloc` + `equatable` |
| Navegación | `go_router` 17 |
| Formularios | `formz` (todavía no usado en pagos) |
| Inyección | `get_it` manual, sin `injectable` |
| HTTP | `dio` |
| Fuente | Source Sans Pro |

**Arquitectura:** Clean Architecture con `data/`, `domain/`, `presentation/`. Notas: `controllers` vive dentro de `data/`, y la carpeta `repositoriets` está mal escrita en el proyecto (se respeta la convención existente).

**Design system** en `core/theme/`:

- `AppColors` — sin amarillo de marca ni el borde `#E7E9EB` del Figma
- `TextStyles` — `ThemeExtension`, se lee con `Theme.of(context).extension<TextStyles>()!`
- `AppSpacing` / `AppInsets` — escala completa de espaciados
- `AppRadii` — fuerza radio 16 en todo el sistema
- Sin explorar: `color_palet.dart`, `design_tokens.dart`

---

## 2. Estructura creada

```
lib/
├─ core/
│  └─ utils/
│     ├─ currency_format.dart          # formatMoney(), compartido
│     └─ card_brand.dart               # detección de marca por BIN
├─ domain/models/
│  ├─ payment_line_item.dart           # línea del desglose
│  ├─ select_payment_method.dart       # PaymentMethodType, SavedPaymentMethod, CardData
│  ├─ wallet.dart                      # WalletTab, WalletBalance, WalletSummaryItem
│  └─ wallet_transaction.dart          # movimiento del historial
└─ presentation/
   ├─ payments/
   │  ├─ payment_method_flow.dart      # orquestador del flujo de alta
   │  ├─ payment_method_selection_view.dart
   │  ├─ add_card_view.dart
   │  ├─ payment_playground_page.dart  # TEMPORAL
   │  └─ widgets/
   │     ├─ payment_brand.dart         # tokens propios del módulo
   │     ├─ service_payment_card.dart
   │     ├─ payment_method_option_tile.dart
   │     ├─ saved_payment_method_tile.dart
   │     ├─ card_form_fields.dart
   │     ├─ card_brand_icon.dart
   │     ├─ payment_sheet.dart
   │     ├─ payment_status_sheet.dart
   │     ├─ payment_methods_sheet.dart
   │     └─ select_payment_method_sheet.dart
   └─ wallet/
      ├─ wallet_home_view.dart
      ├─ wallet_history_view.dart
      ├─ wallet_dummy_data.dart        # TEMPORAL
      └─ widgets/
         ├─ wallet_balance_card.dart
         ├─ wallet_action_button.dart
         ├─ wallet_summary_card.dart   # incluye WalletSectionHeader
         ├─ wallet_transaction_tile.dart
         └─ wallet_history_preview.dart
```

Assets agregados: `assets/payments/icons/` con `zelle.png` y `paypal.png`, registrado en `pubspec.yaml`.

---

## 3. Componentes

### Pagos

**`ServicePaymentCard`** — desglose de pago de un servicio. Presentacional puro, sin ancho fijo (en el chat mide 328 pero lo impone el padre). Con `status` y `onAction` opcionales sirve para tres casos: pendiente con botón, resumen sin chip, y completado.

**`PaymentMethodOptionTile`** — celda del grid de formas de pago. Caja de 68 de alto fija, label debajo que puede ocupar dos líneas.

**`SavedPaymentMethodTile`** — fila de método guardado, 60 de alto. `showLabel: false` cuando el logo de marca ya identifica el método (PayPal, Zelle).

**`CardFormFields`** — formulario de tarjeta controlado desde afuera. Incluye `CardNumberInputFormatter` (grupos de 4) y `ExpiryDateInputFormatter` (MM/AA), ambos propios para no sumar dependencias.

**`CardBrandIcon`** + **`detectCardBrand`** — logo de marca según el prefijo del número, con `AnimatedSwitcher`. Sirve para mostrar, no para validar.

**`PaymentSheetScaffold`** + **`showPaymentSheet`** — base de los bottom sheets: título con ícono, contenido y botón fijo abajo.

**`PaymentMethodsSheet`** — lista los métodos guardados o muestra el estado vacío; en ambos casos permite agregar uno nuevo. Devuelve un `sealed class` (`PaymentMethodSelected` / `PaymentMethodAddRequested`).

**`SelectPaymentMethodSheet`** — grid de tipos de método dentro de un sheet. Devuelve el `PaymentMethodType` elegido.

**`PaymentStatusSheet`** — mensaje centrado con ícono. Tres tonos: info, éxito, error.

**`PaymentMethodFlow`** — encadena: lista/vacío → selección de tipo → alta de tarjeta → éxito. Es el reemplazo temporal de un cubit.

### Wallet

**`WalletBalanceCard`** — tarjeta azul con saldo, selector de activo y ocultar/mostrar monto.

**`WalletActionButton`** — acción circular (Depositar, Retirar, Enviar, Análisis).

**`WalletSummaryCard`** + **`WalletSectionHeader`** — resumen financiero con montos coloreados según `WalletAmountTone`.

**`WalletTransactionTile`** — movimiento con fondo tintado: verde ingreso, rosa egreso. Fecha arriba a la izquierda, hora a la derecha.

**`WalletHistoryPreview`** — últimos 3 movimientos más el enlace "Ver todo".

**`WalletHistoryView`** — pantalla completa con filtros (Todos / Ingresos / Egresos) y estado vacío.

---

## 4. Decisiones técnicas

**Wrap en vez de GridView.** El grid del Figma tiene filas de distinta altura (324×321, con la fila del medio a 111 por el label de dos líneas). `GridView` con `childAspectRatio` fuerza celdas iguales y desbordaba. El ancho se calcula con `LayoutBuilder` para no romper en pantallas angostas.

**Medidas del Figma sobre el design system.** Radio 12 y borde `#E7E9EB`, aunque `AppRadii` fuerce 16 y `AppColors.fieldBorder` sea `#E0E0E0`. Centralizado en `PaymentBrand` para revertirlo en un solo lugar si el equipo decide lo contrario.

**Vistas tontas.** Ninguna pantalla instancia repositorios ni navega por su cuenta; todo entra y sale por parámetros. El día que haya cubit, se enchufa sin tocar la UI.

**Modales sobre la barra de navegación.** La barra flotante del `ShellRoute` tapaba los sheets. Se resolvió con `useRootNavigator: true` más `reserveBottomBar` (96 de padding inferior). Para `AddCardView`, que es una pantalla y no un sheet, se usa `Navigator.of(context, rootNavigator: true).push(...)`.

**Sin `intl`.** No está en el proyecto, así que el formateo de moneda y fechas se hizo a mano.

---

## 5. Estado de la API

**Base:** `https://api.speedygo.casa`, con paths tipo `/api/v1/clients/<recurso>`.

### Pagos (existe, no conectado)

`POST {{api_url}}/payments/intent` con `Authorization: {{token}}`.

```json
{
  "service_request_id": 313,
  "payment_type": "final_payment",
  "payment_method": "pagomovil",
  "use_wallet": false
}
```

Genera un `intent_uuid`. Hay endpoints para inspección técnica, servicio finalizado, recarga de wallet y compra de productos.

En `data/data_sources/online/` ya existen `payment_methods_api.dart`, `wallet_api.dart` y `transaction_api.dart`, sin revisar todavía.

### Wallet (bloqueado)

Vive en **Atlas**, un servicio aparte:

```
GET https://atlas-users.speedygo.casa/api/v1/wallets/funds/{atlas_user_id}
```

Headers: `Authorization`, `X-API-Key`, `X-Timestamp`, `X-Signature`.

La API key está en `AppConfig.atlasUsersApiKey`. **El algoritmo de firma no está en el proyecto** y es lo que bloquea la conexión. El login de Atlas devuelve `access_token`, `session_id` y `user_id` — para el path va el `user_id`, no el `session_id`.

### Preguntas abiertas para el backend

1. ¿Cómo se genera el `X-Signature`? (probablemente esté en el script de pre-request de la colección de Postman)
2. ¿La app debe pegarle a Atlas directo o pasar por Laravel? Si es lo segundo, la firma deja de ser problema del cliente.
3. ¿De dónde sale el desglose de conceptos del pago? `client-solicitudes` solo trae `base_price` y `final_price`, no las líneas del diseño.
4. ¿Qué valores toman `payment_status` y `payment_method`?
5. ¿El "Resumen financiero" (capital invertido, dividendos) tiene backend, o es diseño adelantado?

---

## 6. Pendientes

**Assets:** `visa.png` y `mastercard.png`; el ícono de moneda/joys del header de la wallet; reemplazar los íconos Material provisionales del grid por los propios si existen.

**Validación:** los `FormzInput` de tarjeta (Luhn, vencimiento no pasado, CVV según marca) en `core/form_validation/`. Hoy solo hay un chequeo mínimo con `CardData.isComplete`.

**Pantallas faltantes:** Retirar, Enviar, Análisis; los métodos que no son tarjeta (pago móvil, Zelle, transferencia) muestran "no disponible".

**Limpieza al final:** borrar `payment_playground_page.dart`, `wallet_dummy_data.dart`, la ruta `/playground/payments` y su entrada en `authFreePaths`.

**Riesgos detectados (no son tareas del módulo, pero conviene reportarlos):**

- `client-solicitudes` devuelve el `token_api` (JWT) y el email del fixer al cliente
- `AppConfig.atlasUsersApiKey` tiene valor por defecto hardcodeado y termina en el APK
- La ruta `/walletspeed` reemplazó a `RealEstateOpsPage`; si alguien navega con `extra: property`, ese dato queda huérfano

---

## 7. Prompt para retomar

> Trabajo en `speedygo_app`, una app Flutter de servicios a domicilio (Clean Architecture, flutter_bloc, go_router, get_it, dio, formz). Estoy a cargo del módulo de pagos y wallet.
>
> Ya tengo construida toda la capa de presentación con datos dummy: el card de desglose de pago (`ServicePaymentCard`), la selección de método de pago, el alta de tarjeta con formatters propios y detección de marca por BIN, los bottom sheets del flujo (`PaymentSheetScaffold`, `PaymentMethodsSheet`, `SelectPaymentMethodSheet`, `PaymentStatusSheet`), el orquestador `PaymentMethodFlow`, y la pantalla de wallet completa con saldo, acciones, resumen financiero e historial.
>
> Todos los componentes son presentacionales puros: reciben datos y callbacks por parámetros, no instancian repositorios ni navegan por su cuenta. Usan los tokens de `core/theme/` (`AppColors`, `TextStyles` como ThemeExtension, `AppSpacing`, `AppRadii`), más un `PaymentBrand` propio para el amarillo de marca y las medidas del Figma que difieren del design system.
>
> Convenciones que sigo: cambios mínimos y quirúrgicos, nada de reescribir archivos que ya funcionan; medidas exactas del Figma; respetar los patrones existentes del proyecto en vez de imponer los míos.
>
> Lo que falta es conectar la API. Los endpoints de pagos van por `api.speedygo.casa/api/v1/` y funcionan con token. La wallet vive en un servicio aparte (`atlas-users.speedygo.casa`) que exige `X-Signature` y `X-Timestamp`, y todavía no tengo el algoritmo de firma.
