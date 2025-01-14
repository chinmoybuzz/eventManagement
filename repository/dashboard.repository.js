const errorHandler = require("../helper/errorHandler");
const JobModel = require("../models/job.model");
const CategoryModel = require("../models/category.model");
const UserModel = require("../models/user.model");
const PostModel = require("../models/post.model");
const { UserRole } = require("../helper/typeConfig");
const ServiceModel = require("../models/service.model");
const { capitalize } = require("lodash");
const faqModel = require("../models/faq.model");

exports.details = async (params) => {
  try {
    const data = [];

    data.push(
      await getTotalUserCount({
        ...params,
        role: UserRole[1],
        urlSuffix: "admins/list",
      })
    );
    data.push(
      await getTotalUserCount({
        ...params,
        role: UserRole[0],
        urlSuffix: "users/list",
      })
    );
    data.push(
      await getTotalUserCount({
        ...params,
        role: UserRole[2],
        urlSuffix: "vendors/list",
      })
    );
    data.push(await getTotalJobCount(params));
    data.push(await getjobCategoryCount());
    data.push(await getPostCategoryCount());
    data.push(await getServiceCategoryCount());
    data.push(await getTotalPostCount(params));
    data.push(await getTotalfaq(params));
    data.push(await getTotalService());

    return { status: 200, message: "Details fetch", data };
  } catch (err) {
    return errorHandler(err, params);
  }
};

const getjobCategoryCount = async () => {
  const jobquery = { deletedAt: null, type: 1 };
  const jobcount = await CategoryModel.find(jobquery).select("createdAt").count();
  return {
    totalCount: jobcount,
    title: "Job Category",
    icon: "CalendarOutlined",
    urlSuffix: "/category/list?type=1",
  };
};

const getPostCategoryCount = async () => {
  const jobquery = { deletedAt: null, type: 2 };
  const jobcount = await CategoryModel.find(jobquery).select("createdAt").count();
  return {
    totalCount: jobcount,
    title: "Post Category",
    icon: "CalendarOutlined",
    urlSuffix: "/category/list?type=2",
  };
};

const getServiceCategoryCount = async () => {
  const eventquery = { deletedAt: null, type: 3 };
  const serviceCout = await CategoryModel.find(eventquery).select("createdAt").count();
  return {
    totalCount: serviceCout,
    title: "Service Category",
    icon: "CalendarOutlined",
    urlSuffix: "/category/list?type=3",
  };
};

const getTotalUserCount = async (params) => {
  const query = { deletedAt: null, roleCode: params.role };
  const count = await UserModel.find(query).select("createdAt").count();

  return {
    totalCount: count,
    title: capitalize(params.role),
    icon: "UsergroupAddOutlined",
    urlSuffix: params.urlSuffix,
  };
};

const getTotalJobCount = async (params) => {
  const query = { deletedAt: null };
  if (params.authUser && params.authUser.role == UserRole[3]) query.company = params.authUser._id;

  const count = await JobModel.find(query).select("createdAt").count();

  return {
    totalCount: count,
    title: "Job",
    icon: "FileSearchOutlined",
    urlSuffix: "job/list",
  };
};

const getTotalPostCount = async (params) => {
  const query = { deletedAt: null };
  const count = await PostModel.find(query).select("createdAt").count();

  return {
    totalCount: count,
    title: "Post",
    icon: "FileTextOutlined",
    urlSuffix: "posts/list",
  };
};

const getTotalService = async (params) => {
  const query = { deletedAt: null };
  const count = await ServiceModel.find(query).select("createdAt").count();
  return {
    totalCount: count,
    title: "Service",
    icon: "FileTextOutlined",
    urlSuffix: "service/list",
  };
};

const getTotalfaq = async (params) => {
  const query = { deletedAt: null };
  const count = await faqModel.find(query).select("createdAt").count();
  return {
    totalCount: count,
    title: "Faq",
    icon: "FileTextOutlined",
    urlSuffix: "faq/list",
  };
};
