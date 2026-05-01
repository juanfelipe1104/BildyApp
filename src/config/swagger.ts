import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
        title: "BildyApp API",
        version: "1.0.0",
        description: "API REST para gestión de usuarios, clientes, proyectos y albaranes"
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Servidor local"
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },
        schemas: {
            UserAuthInput: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: {
                        type: "string",
                        format: "email",
                        example: "juan@example.com"
                    },
                    password: {
                        type: "string",
                        minLength: 8,
                        maxLength: 16,
                        example: "Password123"
                    }
                }
            },

            UserValidationInput: {
                type: "object",
                required: ["code"],
                properties: {
                    code: {
                        type: "string",
                        example: "123456"
                    }
                }
            },

            UserDataInput: {
                type: "object",
                required: ["name", "lastName", "nif"],
                properties: {
                    name: {
                        type: "string",
                        example: "Juan"
                    },
                    lastName: {
                        type: "string",
                        example: "Rodríguez Córdoba"
                    },
                    nif: {
                        type: "string",
                        example: "12345678Z"
                    },
                    address: {
                        $ref: "#/components/schemas/Address"
                    }
                }
            },

            CompanyInput: {
                oneOf: [
                    {
                        type: "object",
                        required: ["isFreelance"],
                        properties: {
                            isFreelance: {
                                type: "boolean",
                                enum: [true],
                                example: true
                            }
                        }
                    },
                    {
                        type: "object",
                        required: ["isFreelance", "name", "cif", "address"],
                        properties: {
                            isFreelance: {
                                type: "boolean",
                                enum: [false],
                                example: false
                            },
                            name: {
                                type: "string",
                                example: "Bildy Construcciones SL"
                            },
                            cif: {
                                type: "string",
                                example: "B12345678"
                            },
                            address: {
                                $ref: "#/components/schemas/Address"
                            }
                        }
                    }
                ]
            },

            RefreshTokenInput: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                    refreshToken: {
                        type: "string",
                        example: "b3f7d99f-52f1-4a44-bc14-token"
                    }
                }
            },

            AuthResponse: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        example: "Login exitoso"
                    },
                    user: {
                        $ref: "#/components/schemas/User"
                    },
                    access_token: {
                        type: "string",
                        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    },
                    refresh_token: {
                        type: "string",
                        example: "b3f7d99f-52f1-4a44-bc14-token"
                    }
                }
            },

            PasswordChangeInput: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                    currentPassword: {
                        type: "string",
                        example: "Password123"
                    },
                    newPassword: {
                        type: "string",
                        example: "NewPassword123"
                    }
                }
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        example: "Recurso no encontrado"
                    }
                }
            },

            Address: {
                type: "object",
                properties: {
                    street: { type: "string", example: "Calle Mayor" },
                    number: { type: "integer", example: 12 },
                    postal: { type: "integer", example: 28013 },
                    city: { type: "string", example: "Madrid" },
                    province: { type: "string", example: "Madrid" }
                }
            },

            Company: {
                type: "object",
                properties: {
                    _id: {
                        type: "string",
                        example: "663a0d1f9a21b2d4c84fd000"
                    },
                    owner: {
                        type: "string",
                        description: "ID del usuario propietario de la compañía",
                        example: "663a0c8a9a21b2d4c84fc999"
                    },
                    name: {
                        type: "string",
                        example: "Bildy Construcciones SL"
                    },
                    cif: {
                        type: "string",
                        example: "B12345678"
                    },
                    address: {
                        $ref: "#/components/schemas/Address"
                    },
                    logo: {
                        type: "string",
                        nullable: true,
                        example: "https://res.cloudinary.com/demo/image/upload/logo.png"
                    },
                    isFreelance: {
                        type: "boolean",
                        example: false
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                        example: "2026-04-30T10:15:30.000Z"
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                        example: "2026-04-30T10:15:30.000Z"
                    }
                }
            },

            User: {
                type: "object",
                properties: {
                    _id: {
                        type: "string",
                        example: "663a0c8a9a21b2d4c84fc999"
                    },
                    name: {
                        type: "string",
                        example: "Juan"
                    },
                    surnames: {
                        type: "string",
                        example: "Rodríguez Córdoba"
                    },
                    email: {
                        type: "string",
                        format: "email",
                        example: "juan@example.com"
                    },
                    phone: {
                        type: "string",
                        example: "600123123"
                    },
                    role: {
                        type: "string",
                        enum: ["admin", "guest"],
                        example: "admin"
                    },
                    status: {
                        type: "string",
                        enum: ["pending", "verified"],
                        example: "verified"
                    },
                    company: {
                        type: "string",
                        nullable: true,
                        description: "ID de la compañía asociada al usuario",
                        example: "663a0d1f9a21b2d4c84fd000"
                    },
                    fullName: {
                        type: "string",
                        readOnly: true,
                        example: "Juan Rodríguez Córdoba"
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                        example: "2026-04-30T10:15:30.000Z"
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                        example: "2026-04-30T10:15:30.000Z"
                    }
                }
            },

            Client: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "663a0e4f9a21b2d4c84fd123" },
                    name: { type: "string", example: "Cliente SL" },
                    cif: { type: "string", example: "B12345678" },
                    email: { type: "string", example: "cliente@example.com" },
                    phone: { type: "string", example: "600123123" },
                    address: { $ref: "#/components/schemas/Address" }
                }
            },

            Project: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "663a0f8a9a21b2d4c84fd456" },
                    client: { type: "string", example: "663a0e4f9a21b2d4c84fd123" },
                    name: { type: "string", example: "Reforma local" },
                    projectCode: { type: "string", example: "PR-001" },
                    email: { type: "string", example: "obra@example.com" },
                    notes: { type: "string", example: "Proyecto urgente" },
                    active: { type: "boolean", example: true },
                    address: { $ref: "#/components/schemas/Address" }
                }
            },

            Worker: {
                type: "object",
                properties: {
                    name: { type: "string", example: "Juan" },
                    hours: { type: "number", example: 4 }
                }
            },

            DeliveryNote: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "663a10489a21b2d4c84fd789" },
                    client: { type: "string", example: "663a0e4f9a21b2d4c84fd123" },
                    project: { type: "string", example: "663a0f8a9a21b2d4c84fd456" },
                    format: {
                        type: "string",
                        enum: ["material", "hours"],
                        example: "hours"
                    },
                    description: { type: "string", example: "Instalación eléctrica" },
                    workDate: {
                        type: "string",
                        format: "date",
                        example: "2026-04-30"
                    },
                    material: { type: "string", example: "Cemento" },
                    unit: { type: "string", example: "sacos" },
                    quantity: { type: "number", example: 10 },
                    hours: { type: "number", example: 8 },
                    workers: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Worker" }
                    },
                    signed: { type: "boolean", example: false },
                    signatureUrl: {
                        type: "string",
                        example: "https://res.cloudinary.com/demo/image/upload/signature.png"
                    },
                    pdfUrl: {
                        type: "string",
                        example: "https://res.cloudinary.com/demo/raw/upload/albaran.pdf"
                    }
                }
            }
        }
    },
    security: [
        {
            bearerAuth: []
        }
    ]
};

const swaggerSpec = swaggerJSDoc({
    definition: swaggerDefinition,
    apis: ["./src/routes/*.ts", "./src/models/*.ts"]
});

export default swaggerSpec;