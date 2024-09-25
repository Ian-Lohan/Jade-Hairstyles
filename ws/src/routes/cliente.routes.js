const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const pagarme = require('../services/pagarme');
const Cliente = require('../models/cliente');
const SalaoCliente = require('../models/relationship/salaoCliente');

router.post("/", async (req, res) => {
  const db = mongoose.connection;
  const session = await db.startSession();
  session.startTransaction();

  try {
    const { cliente, salaoId } = req.body;
    let newCliente = null;

    // Verificar se o cliente existe
    const existentCliente = await Cliente.findOne({
      $or: [{ email: cliente.email }, { cpf: cliente.cpf }],
    });

    // Se o colaborador nao existe
    if (!existentCliente) {      

      const _id = new mongoose.Types.ObjectId();

      // Criar Customer
      const pagarmeCustomer = await pagarme("customers", {
        external_id: _id,
        name: cliente.nome,
        type: cliente.documento.tipo === "cpf" ? "individual" : "corporation",
        country: cliente.endereco.pais,
        email: cliente.email,
        documents: [
          {
            type: cliente.documento.tipo,
            number: cliente.documento.numero,
          },
        ],
        phone_numbers: [`+55${cliente.telefone}`],
        birthday: cliente.dataNascimento,
      });

      if (pagarmeCustomer.error) {
        throw pagarmeCustomer;
      }

      // Criando Cliente
      newCliente = await Cliente({
        ...cliente,
        _id,
        customerId: pagarmeCustomer.data.id,
      }).save({ session });
    }

    // Relacionamento
    const clienteId = existentCliente
      ? existentCliente._id
      : newCliente._id;

    // Verifica se ja existe o relacionamento com o salao
    const existentRelationship = await SalaoCliente.findOne({
      salaoId,
      clienteId,
      status: { $ne: "E" },
    });

    // SE NAO ESTA VINCULADO
    if (!existentRelationship) {
      await new SalaoCliente({
        salaoId,
        clienteId,
      }).save({ session });
    }

    // SE JA EXISTIR O VINCULO ENTRE CLIENTE E SALAO
    if (existentCliente) {
      await SalaoCliente.findOneAndUpdate(
        {
          salaoId,
          clienteId,
        },
        { status: 'A' },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    if (existentCliente && existentRelationship) {
      res.json({ error: true, message: "Cliente já cadastrado." });
    } else {
      res.json({ error: false });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.json({ error: true, message: err.message });
  }
});

module.exports = router;