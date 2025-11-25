export const typeDefs = /* GraphQL */ `
  type Usuario {
    idUsuario: ID!
    nombre: String!
    correo: String!
    telefono: String!
    fechaRegistro: String!
    detalleDireccion: String!
    idCiudad: ID!
    nombreCiudad: String!
    idDepartamento: ID!
    nombreDepartamento: String!
    idRol: ID!
    nombreRol: String!
  }

  type Rol {
    idRol: ID!
    nombreRol: String!
  }

  type Departamento {
    idDepartamento: ID!
    nombreDepartamento: String!
  }

  type Ciudad {
    idCiudad: ID!
    nombreCiudad: String!
    idDepartamento: ID!
    nombreDepartamento: String!
  }

  type Survey {
    id: ID!
    rating: Int!
    comment: String
    status: String!
    createdAt: String!
    userId: ID!
  }

  type PageInfo {
    page: Int!
    size: Int!
    totalElements: Int!
    totalPages: Int!
  }

  type UsuarioPage {
    content: [Usuario!]!
    pageInfo: PageInfo!
  }

  type RolPage {
    content: [Rol!]!
    pageInfo: PageInfo!
  }

  type DepartamentoPage {
    content: [Departamento!]!
    pageInfo: PageInfo!
  }

  type CiudadPage {
    content: [Ciudad!]!
    pageInfo: PageInfo!
  }

  type SurveyPage {
    content: [Survey!]!
    pageInfo: PageInfo!
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    usuario: Usuario!
  }

  input CreateUsuarioInput {
    nombre: String!
    correo: String!
    telefono: String!
    detalleDireccion: String!
    idCiudad: ID!
    idDepartamento: ID!
    idRol: ID!
  }

  input UpdateUsuarioInput {
    idUsuario: ID!
    nombre: String
    correo: String
    telefono: String
    detalleDireccion: String
    idCiudad: ID
    idDepartamento: ID
    idRol: ID
  }

  input CreateDepartamentoInput {
    nombreDepartamento: String!
  }

  input CreateCiudadInput {
    nombreCiudad: String!
    idDepartamento: ID!
  }

  input CreateRolInput {
    nombreRol: String!
  }

  input RegisterInput {
    nombre: String!
    correo: String!
    password: String!
    telefono: String!
    detalleDireccion: String!
    departamentoNombre: String!
    ciudadNombre: String!
    rolNombre: String!
  }

  input SurveyInput {
    rating: Int!
    comment: String
    status: String!
  }

  type Query {
    me: Usuario
    usuarioById(id: ID!): Usuario
    searchUsuarios(q: String, page: Int, size: Int): UsuarioPage!
    roles(page: Int, size: Int): RolPage!
    departamentos(page: Int, size: Int): DepartamentoPage!
    ciudadesByDepartamento(idDepartamento: ID!, page: Int, size: Int): CiudadPage!
    searchCiudades(q: String, page: Int, size: Int): CiudadPage!
    surveys(page: Int, size: Int): SurveyPage!
  }

  type Mutation {
    registerUser(input: RegisterInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!
    logout(refreshToken: String!): Boolean!

    createUsuario(input: CreateUsuarioInput!): Usuario!
    updateUsuario(input: UpdateUsuarioInput!): Usuario!
    deleteUsuario(id: ID!): Boolean!

    createDepartamento(input: CreateDepartamentoInput!): Departamento!
    createCiudad(input: CreateCiudadInput!): Ciudad!
    createRol(input: CreateRolInput!): Rol!

    submitSurvey(input: SurveyInput!): Survey!
  }
`

