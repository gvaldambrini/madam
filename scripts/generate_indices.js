#!/usr/bin/env node

(function() {
    var async = require('async');
    var elasticsearch = require('elasticsearch');
    var common = require('../common');
    var client = common.createClient();

    var mainIndex = 'main';

    function deleteIndex(callback) {
        client.indices.delete({
            index: mainIndex,
            ignore: 404
        }, function(err, resp, respcode) {
            if (!err) {
                console.log('Index main deleted');
            }
            callback(err, resp);
        });
    }

    function createIndex(callback) {
        client.indices.create({
            index: mainIndex,
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
            index: mainIndex,
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
                                        description: {type: 'string'},
                                        worker: {type: 'string'}
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
            index: mainIndex,
            type: 'workers',
            body: {
                workers: {
                    properties: {
                        name: {
                            type: "string",
                            index_name: "worker_name",
                            index: "not_analyzed"
                        },
                        color: {
                            type: "string",
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

    function createServicesType(callback) {
        client.indices.putMapping({
            index: mainIndex,
            type: 'services',
            body: {
                services: {
                    properties: {
                        names: {
                            type: "string",
                            index_name: "service_name",
                            index: "not_analyzed"
                        }
                    }
                }
            }
        }, function(err, resp, respcode) {
            if (!err) {
                console.log('Type services created');
            }
            callback(err, resp);
        });
    }

    function createUsersType(callback) {
        client.indices.putMapping({
            index: mainIndex,
            type: 'users',
            body: {
                users: {
                    properties: {
                        username: {
                            type: "string",
                            index: "not_analyzed"
                        },
                        password: {
                            type: "string",
                            index: "not_analyzed"
                        },
                        role: {
                            type: "string",
                            index: "not_analyzed"
                        }
                    }
                }
            }
        }, function(err, resp, respcode) {
            if (!err) {
                console.log('Type users created');
            }
            callback(err, resp);
        });
    }

    function generate(_mainIndex, cb) {
        mainIndex = _mainIndex;

        async.series([
            deleteIndex,
            createIndex,
            createCustomerType,
            createWorkersType,
            createServicesType,
            createUsersType
        ], cb);
    }

    module.exports = {
        generate: generate
    };

    if (!module.parent)
        generate(
            mainIndex,
            function(err, results) {
                if (err) {
                    console.log(err, results);
                }
                process.exit(err ? 1 : 0);
        });
}
)();

