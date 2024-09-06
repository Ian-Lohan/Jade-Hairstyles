const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cliente = new Schema({

    nome: {
        type: String,
        required: true,
    },
    telefone: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    senha: {
        type: String,
        required: true,
    },
    foto: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['A', 'I'],
        default: 'A',
    },
    sexo: {
        type: String,
        required: true,
        enum: ['M', 'F'],
    },
    dataNascimento: {
        type: Date, // YYYY-MM-DD
        required: true,
    },
    documento: {
        tipo: {
            type: String,
            enum: ['individual', 'corporation'],
            required: true,
        },
        numero: {
            type: String,
            required: true,
        },
    },
    endereco: {
        cidade: {
            type: String,
            required: true,
        },
        uf: {
            type: String,
            required: true,
        },
        cep: {
            type: String,
            required: true,
        },
        numero: {
            type: String,
            required: true,
        },
        pais: {
            type: String,
            required: true,
        },
    },
    dataCadastro: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model('Cliente', cliente);