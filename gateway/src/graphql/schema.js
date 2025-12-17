const {gql} = require('apollo-server-express')

/***
 * Main GraphQL schema for API Gateway
 * This schema will be stitched with remote schemsas from microservices
 */
const typeDefs = gql`
  scalar Date
  Scalar JSON

  type Query {
    _empty: String
  }

  type Mutation{
    _empty: String
  }

  type Subscription{
    _empty: String
  }
`

module.exports = typeDefs