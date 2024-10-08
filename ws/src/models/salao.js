const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const salao = new Schema({

    nome: {
        type: String,
        required: [true, 'Nome é obrigatório!'],
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório!'],
    },
    senha: {
        type: String,
        default: null,
    },
    telefone: String,
    foto: String,
    capa: String,
    endereco: {
        cidade: String,
        uf: String,
        cep: String,
        numero: String,
        pais: String,
    },
    geo: {
        type: {type: String},
        coordinates: [Number],
    },
    dataCadastro: {
        type: Date,
        default: Date.now,
    }
});

salao.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Salao', salao);