const { trace } = require('@opentelemetry/api');
const tracer = trace.getTracer('saga-orchestrator');

async function reserveInventory(orderId, productId) {
  console.log(`  [Paso 1] Reservando inventario para ${productId} (orden ${orderId})...`);
  const ok = Math.random() > 0.1;
  if (!ok) throw new Error('No hay stock suficiente');
  return { reservationId: `RES-${orderId}` };
}

async function releaseInventory(reservationId) {
  console.log(`  [Compensacion] Liberando reserva ${reservationId}...`);
}

async function chargePayment(orderId, amount) {
  console.log(`  [Paso 2] Cobrando $${amount} (orden ${orderId})...`);
  const ok = Math.random() > 0.4;
  if (!ok) throw new Error('Pago rechazado por el banco');
  return { paymentId: `PAY-${orderId}` };
}

async function confirmOrder(orderId) {
  console.log(`  [Paso 3] Confirmando orden ${orderId}...`);
}

async function runSaga(order) {
  return tracer.startActiveSpan('OrderSaga', async (span) => {
    span.setAttribute('order.id', order.orderId);
    let reservation;
    try {
      reservation = await reserveInventory(order.orderId, order.productId);
      await chargePayment(order.orderId, order.amount);
      await confirmOrder(order.orderId);
      span.setAttribute('saga.status', 'completed');
      console.log(`SAGA COMPLETA: orden ${order.orderId} procesada con exito.`);
      span.end();
      return { success: true };
    } catch (err) {
      console.log(`SAGA FALLIDA en orden ${order.orderId}: ${err.message}`);
      if (reservation) {
        await releaseInventory(reservation.reservationId);
      }
      span.setAttribute('saga.status', 'compensated');
      span.setAttribute('saga.failure_reason', err.message);
      console.log(`SAGA COMPENSADA: orden ${order.orderId} revertida correctamente.`);
      span.end();
      return { success: false, reason: err.message };
    }
  });
}

module.exports = { runSaga };