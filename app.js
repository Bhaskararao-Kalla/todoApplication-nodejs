const express = require("express");
const app = express();
module.exports = app;
app.use(express.json());

const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const isValidPriority = (request, response, next) => {
  const { priority } = request.query;
  const validPriority = ["HIGH", "MEDIUM", "LOW"];

  if (priority !== undefined) {
    const isValid = validPriority.some((query) => query === priority);
    if (isValid === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    next();
  }
};

const isValidCategory = (request, response, next) => {
  const { category } = request.query;
  const validCategory = ["WORK", "HOME", "LEARNING"];

  if (category !== undefined) {
    const isValid = validCategory.some((query) => query === category);
    if (isValid === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    next();
  }
};

const isValidStatus = (request, response, next) => {
  const { status } = request.query;
  const validStatus = ["TO DO", "IN PROGRESS", "DONE"];
  //   console.log(validStatus);

  if (status !== undefined) {
    const isValid = validStatus.some((query) => query === status);
    if (isValid === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    next();
  }
};

const outputFormate = (todo) => {
  return {
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  };
};

app.get(
  "/todos/",
  isValidPriority,
  isValidCategory,
  isValidStatus,
  async (request, response) => {
    const {
      search_q = "",
      priority = "",
      status = "",
      category = "",
    } = request.query;
    const getTodoQuery = `
            SELECT * FROM todo 
            WHERE 
                todo LIKE '%${search_q}%' and
                priority LIKE '%${priority}%' and
                status LIKE '%${status}%' and 
                category LIKE '%${category}%';
        `;

    const todoArray = await db.all(getTodoQuery);
    response.send(todoArray.map((object) => outputFormate(object)));
  }
);

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
        SELECT * FROM todo 
        WHERE id = ${todoId};
    `;

  const todo = await db.get(getTodoQuery);
  if (todo !== undefined) {
    response.send({
      id: todo.id,
      todo: todo.todo,
      priority: todo.priority,
      status: todo.status,
      category: todo.category,
      dueDate: todo.due_date,
    });
  } else {
    response.status(400);
    response.send("Invalid Id");
  }
});

// console.log(isValid(new Date("2012-13-11")));
// console.log(format(new Date("2012-1-13"), "yyyy-MM-dd   "));

const isValidDate = (request, response, next) => {
  const { date } = request.query;

  const dateIsValid = isValid(new Date(`${date}`));
  if (dateIsValid === true) {
    request.query.date = format(new Date(`${date}`), "yyyy-MM-dd");

    next();
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

app.get("/agenda/", isValidDate, async (request, response) => {
  const { date } = request.query;
  const getQuery = `
        SELECT * FROM todo 
        WHERE due_date = '${date}';
    `;

  const todo = await db.all(getQuery);

  if (todo !== undefined) {
    response.send(todo.map((todo) => outputFormate(todo)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//is valid priority Post middleware

const isValidPriorityPt = (request, response, next) => {
  const { priority } = request.body;
  validPriority = ["HIGH", "MEDIUM", "LOW"];

  if (priority !== undefined) {
    const isValid = validPriority.some((query) => query === priority);
    if (isValid === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    next();
  }
};
//valid category post middleware
const isValidCategoryPt = (request, response, next) => {
  const { category } = request.body;
  validCategory = ["WORK", "HOME", "LEARNING"];

  if (category !== undefined) {
    const isValid = validCategory.some((query) => query === category);
    if (isValid === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    next();
  }
};
//valid status post middleware
const isValidStatusPt = (request, response, next) => {
  const { status } = request.body;
  validStatus = ["TO DO", "IN PROGRESS", "DONE"];

  if (status !== undefined) {
    const isValid = validStatus.some((query) => query === status);
    if (isValid === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    next();
  }
};
//valid date post middleware
const isValidDatePt = (request, response, next) => {
  const { dueDate } = request.body;

  if (dueDate !== undefined) {
    const dateIsValid = isValid(new Date(`${dueDate}`));
    if (dateIsValid === true) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    next();
  }
};

//post todo

app.post(
  "/todos/",
  isValidDatePt,
  isValidStatusPt,
  isValidCategoryPt,
  isValidPriorityPt,
  async (request, response) => {
    const { id, todo, priority, status, category, dueDate } = request.body;
    // console.log(request.body);
    const postQuery = `
        INSERT INTO 
        todo (id , todo , priority , status , category , due_date)
        VALUES (
            ${id} ,
            '${todo}' ,
            '${priority}' ,
            '${status}' ,
            '${category}' ,
            '${dueDate}');
    `;
    await db.run(postQuery);
    response.send("Todo Successfully Added");
  }
);

//put data

app.put(
  "/todos/:todoId/",
  isValidDatePt,
  isValidStatusPt,
  isValidCategoryPt,
  isValidPriorityPt,
  async (request, response) => {
    const { todoId } = request.params;
    let updatedKey = "";

    const requestBody = request.body;
    switch (true) {
      case requestBody.priority !== undefined:
        updatedKey = "Priority";
        break;
      case requestBody.status !== undefined:
        updatedKey = "Status";
        break;
      case requestBody.category !== undefined:
        updatedKey = "Category";
        break;
      case requestBody.dueDate !== undefined:
        updatedKey = "Due Date";
        break;
      case requestBody.todo !== undefined:
        updatedKey = "Todo";
        break;
    }

    const getTodoQuery = `
        SELECT * FROM todo 
        WHERE id = ${todoId};
      `;
    const getTodo = await db.get(getTodoQuery);
    const {
      id = getTodo.id,
      status = getTodo.status,
      priority = getTodo.priority,
      category = getTodo.category,
      dueDate = getTodo.due_date,
      todo = getTodo.todo,
    } = request.body;

    const updateQuery = `
        UPDATE todo 
        SET 
            id = ${id} ,
            status = '${status}' ,
            priority = '${priority}' , 
            category = '${category}' ,
            todo = '${todo}' ,
            due_date = '${dueDate}';
      `;
    await db.run(updateQuery);
    response.send(`${updatedKey} Updated`);
  }
);

//todo delete

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteQuery = `
            DELETE FROM todo 
            WHERE id = ${todoId};
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
