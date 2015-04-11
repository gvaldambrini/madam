#!/usr/bin/env node

var program = require('commander');
var async = require('async');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client();


function deleteIndex(callback) {
    client.indices.delete({
        index: 'main'
    }, function(err, resp, respcode) {
        if (!err) {
            console.log('Index main deleted');
        }
        callback(err, resp);
    });
}

function createIndex(callback) {
    client.indices.create({
        index: 'main',
        body: {
            settings: {
                number_of_shards: 1,
                analysis: {
                    tokenizer: {
                        edge_ngram_tokenizer: {
                            type: "edgeNGram",
                            min_gram: 1,
                            max_gram: 20,
                            token_chars: ["letter", "digit"]
                        },
                        ngram_tokenizer: {
                            type: "nGram",
                            min_gram: 1,
                            max_gram: 20,
                            token_chars: ["letter", "digit"]
                        },
                    },
                    analyzer: {
                        searchable_text: {
                            filter: [
                                'standard',
                                'lowercase'
                            ],
                            type: 'custom',
                            tokenizer: 'standard'
                        },
                        searchable_text_partial: {
                            filter: [
                                'standard',
                                'lowercase'
                            ],
                            type: 'custom',
                            tokenizer: 'ngram_tokenizer'
                        },
                        searchable_text_autocomplete: {
                            filter: [
                                'standard',
                                'lowercase'
                            ],
                            type: 'custom',
                            tokenizer: 'edge_ngram_tokenizer'
                        }
                    }
                }
            },
        }
    }, function(err, resp, respcode) {
        if (!err) {
            console.log('Index main created');
        }
        callback(err, resp);
    });
}

function createCustomerType(callback) {
    client.indices.putMapping({
        index: 'main',
        type: 'customer',
        body: {
            customer: {
                properties: {
                    name: {
                        type: 'multi_field',
                        fields: {
                            name: {
                                type: 'string',
                                analyzer: 'searchable_text'
                            },
                            autocomplete: {
                                type: 'string',
                                search_analyzer: 'searchable_text',
                                index_analyzer: 'searchable_text_autocomplete',
                                term_vector: 'with_positions_offsets'
                            }
                        }
                    },
                    surname: {
                        type: 'multi_field',
                        fields: {
                            surname: {
                                type: 'string',
                                analyzer: 'searchable_text'
                            },
                            autocomplete: {
                                type: 'string',
                                search_analyzer: 'searchable_text',
                                index_analyzer: 'searchable_text_autocomplete',
                                term_vector: 'with_positions_offsets'
                            }
                        }
                    },
                    mobile_phone: {
                        type: 'multi_field',
                        fields: {
                            mobile_phone: {
                                type: 'string',
                                analyzer: 'searchable_text'
                            },
                            partial: {
                                type: 'string',
                                search_analyzer: 'searchable_text',
                                index_analyzer: 'searchable_text_partial',
                                term_vector: 'with_positions_offsets'
                            }
                        }
                    },
                    allow_sms: {type: 'boolean'},
                    phone: {
                        type: 'multi_field',
                        fields: {
                            phone: {
                                type: 'string',
                                analyzer: 'searchable_text'
                            },
                            partial: {
                                type: 'string',
                                search_analyzer: 'searchable_text',
                                index_analyzer: 'searchable_text_partial',
                                term_vector: 'with_positions_offsets'
                            }
                        }
                    },
                    email: {type: 'string'},
                    allow_email: {type: 'boolean'},
                    discount: {type: 'integer'},
                    first_see: {type: 'date'},
                    last_see: {type: 'date'},
                    notes: {type: 'string'},
                    appointments: {
                        properties: {
                            date: {type: 'date'},
                            services: {
                                properties: {
                                    description: {type: 'string'}
                                }
                            },
                            satisfaction: {type: 'integer'},
                            discount: {type: 'integer'},
                            notes: {type: 'string'}
                        }
                    },
                }
            }
        }
    }, function(err, resp, respcode) {
        if (!err) {
            console.log('Type customer created');
        }
        callback(err, resp);
    });
}

function createWorkersType(callback) {
    client.indices.putMapping({
        index: 'main',
        type: 'workers',
        body: {
            workers: {
                properties: {
                    names : {
                        type: "string",
                        index_name: "worker_name",
                        index: "not_analyzed"
                    }
                }
            }
        }
    }, function(err, resp, respcode) {
        if (!err) {
            console.log('Type workers created');
        }
        callback(err, resp);
    });
}

program
    .description('Generate elastisearch indices.')
    .option('-d, --delete', 'delete old indices')
    .parse(process.argv);


var tasks = [];

if (program.delete)
    tasks[tasks.length] = deleteIndex;

tasks[tasks.length] = createIndex;
tasks[tasks.length] = createCustomerType;
tasks[tasks.length] = createWorkersType;

async.series(
    tasks,
    // optional callback
    function(err, results) {
        if (err) {
            console.log(err, results);
        }
        process.exit(err ? 1 : 0);
    });
