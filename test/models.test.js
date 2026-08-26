import test from "node:test";
import assert from "node:assert/strict";
import Customer from "../src/models/Customer.js";
import Transaction from "../src/models/Transaction.js";

test("models serialize Mongo _id as frontend id", () => {
  const customer = new Customer({ name: "Test Swimmer", mobile: "9999999999" });
  const value = customer.toJSON();
  assert.equal(value.id, customer._id.toString());
  assert.equal(value._id, undefined);
});

test("transaction validates frontend enum values", async () => {
  const transaction = new Transaction({
    billNumber: "BP000001",
    customerId: new Customer()._id,
    serviceType: "INVALID",
    serviceName: "Test",
    amount: 100,
    paymentMethod: "CASH",
  });
  const error = transaction.validateSync();
  assert.match(error.errors.serviceType.message, /not a valid enum value/);
});
