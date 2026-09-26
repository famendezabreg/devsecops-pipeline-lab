const sdk = require('./tracing');
const { runSaga } = require('./saga-orchestrator');

async function main() {
  for (let i = 0; i < 5; i++) {
    console.log(`--- Intento ${i + 1} ---`);
    await runSaga({ orderId: `SAGA-${Date.now()}-${i}`, productId: 'sku-1', amount: 20 });
  }
  await sdk.shutdown();
}

main();