const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const pagarme = require("../services/pagarme");
const Colaborador = require("../models/colaborador");
const SalaoColaborador = require("../models/relationship/salaoColaborador");
const ColaboradorServico = require("../models/relationship/colaboradorServico");

router.post("/", async (req, res) => {
  const db = mongoose.connection;
  const session = await db.startSession();
  session.startTransaction();

  try {
    const { colaborador, salaoId } = req.body;
    let newColaborador = null;

    // Verificar se o colaborador existe
    const existentColaborador = await Colaborador.findOne({
      $or: [{ email: colaborador.email }, { cpf: colaborador.cpf }],
    });

    // Se o colaborador nao existe, registrar
    if (!existentColaborador) {
      // Criar Conta Bancaria
      const { contaBancaria } = colaborador;
      const pagarmeBankAccount = await pagarme('bank_accounts', {
				bank_code: contaBancaria.banco,
        document_number: contaBancaria.cpfCnpj,
        agencia: contaBancaria.agencia,
        conta: contaBancaria.numero,
        conta_dv: contaBancaria.dv,
        type: contaBancaria.tipo,
        legal_name: contaBancaria.titular,
        api_key: process.env.MP_API_KEY,
      });

      if (pagarmeBankAccount.error) {
        throw pagarmeBankAccount;
      }

      // Criar Recebedor
      const pagarmeRecipient = await pagarme("recipients", {
        transfer_interval: "daily",
        transfer_enabled: true,
        bank_account_id: pagarmeBankAccount.id,
      });

      if (pagarmeBankAccount.error) {
        throw pagarmeRecipient;
      }

      // Criando Colaborador
      newColaborador = await new Colaborador({
        ...colaborador,
        recipientId: pagarmeRecipient.id,
      }).save({ session });
    }

    // Relacionamento
    const colaboradorId = existentColaborador
      ? existentColaborador._id
      : newColaborador._id;

    // Verifica se ja existe o relacionamento com o salao
    const existentRelationship = await salaoColaborador.findOne({
      colaboradorId,
      salaoId,
      status: { $ne: "E" },
    });

    // SE NAO ESTA VINCULADO
    if (!existentRelationship) {
      await new SalaoColaborador({
        salaoId,
        colaboradorId,
        status: colaborador.vinculo,
      }).save({ session });
    }

    // SE JA EXISTIR O VINCULO ENTRE COLABORADOR E SALAO
    if (existentRelationship) {
      const existentRelationship = await salaoColaborador.findOneAndUpdate(
        {
          colaboradorId,
          salaoId,
        },
        { status: colaborador.vinculo },
        { session }
      );
    }

    // RELACAO COM AS ESPECIALIDADES
    // ['123', '456', '789']
    await ColaboradorServico.insertMany(
      colaborador.especialidades.map(
        (servicoId) => ({
          servicoId,
          colaboradorId,
        }),
        { session }
      )
    );

    await session.commitTransaction();
    session.endSession();

    if (existentColaborador && existentRelationship) {
      res.json({ error: true, message: "Colaborador já cadastrado." });
    } else {
      res.json({ error: false });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.json({ error: true, message: err.message });
  }
});

router.put("/:colaboradorId", async (req, res) => {
  try {
    const { vinculo, vinculoId, especialidades } = req.body;
    const { colaboradorId } = req.params;

    // Vinculo
    await SalaoColaborador.findByIdAndUpdate(vinculoId, { status: vinculo });

    // Especialidades
    await ColaboradorServico.deleteMany({ colaboradorId });

    await ColaboradorServico.insertMany(
      especialidades.map(
        (servicoId) => ({
        servicoId,
        colaboradorId,
      }))
    )

    res.json({ error: false });

  } catch (err) {
    res.json({ error: true, message: err.message });
  }
})

router.delete("/vinculo/:id", async (req, res) => {
  try {
    await SalaoColaborador.findByIdAndUpdate(req.params.id, { status: "E" });
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
})

router.post("/filter", async (req, res) => {
  try {
    const colaboradores = await Colaborador.find(req.body.filters);
    res.json({ error: false, colaboradores });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
})

router.get("/salao/:salaoId", async (req, res) => {
  try {
    const { salaoId } = req.params;
    let listaColaboradores = [];
    // Recuperar Vinculos
    const vinculosColaboradores = await SalaoColaborador.find({
      salaoId,
      status: { $ne: 'E' },
    })
    .populate({ path: 'colaboradorId', select: '-senha -recipientId' })
    .select('colaboradorId dataCadastro status');

    for (let vinculo of salaoColaboradores) {
      const especialidades = await ColaboradorServico.find({
        colaboradorId: vinculo.colaboradorId._id,
      });

      listaColaboradores.push({
        ...vinculo._doc,
        especialidades,
      })
    }

    res.json({
      error: false,
      colaboradores: listaColaboradores.map((vinculo) => ({
        ...vinculo.colaboradorId._doc,
        vinculoId: vinculo._id,
        vinculo: vinculo.status,
        especialidades: vinculo.especialidades,
        dataCadastro: vinculo.dataCadastro,
      })),
    });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
})

module.exports = router;
