#!/usr/bin/env node

var program = require('commander');
var async = require('async');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client();


function deleteIndex(callback) {
    client.indices.delete({
        index: 'customers'
    }, function(err, resp, respcode) {
        if (!err) {
            console.log('Index customers deleted');
        }
        callback(err, resp);
    });
}

function createIndex(callback) {
    client.indices.create({
        index: 'customers',
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
            console.log('Index customers created');
        }
        callback(err, resp);
    });
}

function putMapping(callback) {
    client.indices.putMapping({
        index: 'customers',
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
            console.log('Mapping customer created');
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
tasks[tasks.length] = putMapping;

async.series(
    tasks,
    // optional callback
    function(err, results) {
        if (err) {
            console.log(err, results);
        }
        process.exit(err ? 1 : 0);
    });
