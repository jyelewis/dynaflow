import { conditionToConditionExpression } from "../conditionToConditionExpression.js";
import { ConditionExpressionProperties } from "../../types/operations.js";
import { DFDB } from "../../DFDB.js";
import { testDbConfig } from "../../testHelpers/testDbConfigs.js";

describe("conditionToConditionExpression", () => {
  const db = new DFDB(testDbConfig);

  // both runs this expression against the database
  // and asserts against the returned object
  async function testExpression(
    conditionExpression: ConditionExpressionProperties,
    shouldEqual: ConditionExpressionProperties
  ) {
    expect(conditionExpression).toEqual(shouldEqual);

    // run the expression against the database
    // to verify it doesn't reject this expression
    await db.client.query({
      TableName: db.tableName,
      KeyConditionExpression: "#pk = :pk AND #sk = :sk",
      FilterExpression: conditionExpression.conditionExpression,

      ExpressionAttributeNames: {
        "#pk": "_PK",
        "#sk": "_SK",
        ...conditionExpression.expressionAttributeNames,
      },
      ExpressionAttributeValues: {
        ":pk": "nothing",
        ":sk": "nothing",
        ...conditionExpression.expressionAttributeValues,
      },
    });
  }

  it.concurrent("Basic literal equals", () => {
    return testExpression(
      conditionToConditionExpression({
        firstName: "Joe",
      }),
      {
        conditionExpression: "(#exp0 = :exp0)",
        expressionAttributeNames: {
          "#exp0": "firstName",
        },
        expressionAttributeValues: {
          ":exp0": "Joe",
        },
      }
    );
  });

  it.concurrent("$eq", () => {
    return testExpression(
      conditionToConditionExpression({
        firstName: { $eq: "Joe" },
      }),
      {
        conditionExpression: "(#exp0 = :exp0)",
        expressionAttributeNames: {
          "#exp0": "firstName",
        },
        expressionAttributeValues: {
          ":exp0": "Joe",
        },
      }
    );
  });

  it.concurrent("Literal equals (multiple)", () => {
    return testExpression(
      conditionToConditionExpression({
        firstName: "Joe",
        lastName: "Bot",
      }),
      {
        conditionExpression: "(#exp0 = :exp0) AND (#exp1 = :exp1)",
        expressionAttributeNames: {
          "#exp0": "firstName",
          "#exp1": "lastName",
        },
        expressionAttributeValues: {
          ":exp0": "Joe",
          ":exp1": "Bot",
        },
      }
    );
  });

  it.concurrent("$ne", () => {
    return testExpression(
      conditionToConditionExpression({
        firstName: { $ne: "Joe" },
      }),
      {
        conditionExpression: "(#exp0 <> :exp0)",
        expressionAttributeNames: {
          "#exp0": "firstName",
        },
        expressionAttributeValues: {
          ":exp0": "Joe",
        },
      }
    );
  });

  it.concurrent("$exists: true", () => {
    return testExpression(
      conditionToConditionExpression({
        firstName: { $exists: true },
      }),
      {
        conditionExpression: "(attribute_exists(#exp0))",
        expressionAttributeNames: {
          "#exp0": "firstName",
        },
        expressionAttributeValues: undefined,
      }
    );
  });

  it.concurrent("$exists: false", () => {
    return testExpression(
      conditionToConditionExpression({
        firstName: { $exists: false },
      }),
      {
        conditionExpression: "(attribute_not_exists(#exp0))",
        expressionAttributeNames: {
          "#exp0": "firstName",
        },
        expressionAttributeValues: undefined,
      }
    );
  });

  it.concurrent("$gt", () => {
    return testExpression(
      conditionToConditionExpression({
        age: { $gt: 30 },
      }),
      {
        conditionExpression: "(#exp0 > :exp0)",
        expressionAttributeNames: {
          "#exp0": "age",
        },
        expressionAttributeValues: {
          ":exp0": 30,
        },
      }
    );
  });

  it.concurrent("$gte", () => {
    return testExpression(
      conditionToConditionExpression({
        age: { $gte: 30 },
      }),
      {
        conditionExpression: "(#exp0 >= :exp0)",
        expressionAttributeNames: {
          "#exp0": "age",
        },
        expressionAttributeValues: {
          ":exp0": 30,
        },
      }
    );
  });

  it.concurrent("$lt", () => {
    return testExpression(
      conditionToConditionExpression({
        age: { $lt: 30 },
      }),
      {
        conditionExpression: "(#exp0 < :exp0)",
        expressionAttributeNames: {
          "#exp0": "age",
        },
        expressionAttributeValues: {
          ":exp0": 30,
        },
      }
    );
  });

  it.concurrent("$lte", () => {
    return testExpression(
      conditionToConditionExpression({
        age: { $lte: 30 },
      }),
      {
        conditionExpression: "(#exp0 <= :exp0)",
        expressionAttributeNames: {
          "#exp0": "age",
        },
        expressionAttributeValues: {
          ":exp0": 30,
        },
      }
    );
  });

  it.concurrent("$beginsWith", () => {
    return testExpression(
      conditionToConditionExpression({
        name: { $beginsWith: "Lew" },
      }),
      {
        conditionExpression: "(begins_with(#exp0, :exp0))",
        expressionAttributeNames: {
          "#exp0": "name",
        },
        expressionAttributeValues: {
          ":exp0": "Lew",
        },
      }
    );
  });

  it.concurrent("$betweenIncl", () => {
    return testExpression(
      conditionToConditionExpression({
        age: { $betweenIncl: [30, 45] },
      }),
      {
        conditionExpression: "(#exp0 BETWEEN :exp0_gte AND :exp0_lte)",
        expressionAttributeNames: {
          "#exp0": "age",
        },
        expressionAttributeValues: {
          ":exp0_gte": 30,
          ":exp0_lte": 45,
        },
      }
    );
  });

  it.concurrent("$in", () => {
    return testExpression(
      conditionToConditionExpression({
        count: { $in: [2, 4, 6, 8] },
      }),
      {
        conditionExpression: "(#exp0 IN (:exp0_0,:exp0_1,:exp0_2,:exp0_3))",
        expressionAttributeNames: {
          "#exp0": "count",
        },
        expressionAttributeValues: {
          ":exp0_0": 2,
          ":exp0_1": 4,
          ":exp0_2": 6,
          ":exp0_3": 8,
        },
      }
    );
  });

  it.concurrent("$contains", () => {
    return testExpression(
      conditionToConditionExpression({
        name: { $contains: "and sons" },
      }),
      {
        conditionExpression: "(contains(#exp0, :exp0))",
        expressionAttributeNames: {
          "#exp0": "name",
        },
        expressionAttributeValues: {
          ":exp0": "and sons",
        },
      }
    );
  });
});