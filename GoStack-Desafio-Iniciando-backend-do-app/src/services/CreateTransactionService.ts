import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const checkCategoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!checkCategoryExists) {
      const createRepository = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(createRepository);
    }

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transacion type is invalid');
    }

    const { total } = await transactionsRepository.getBalance();

    const validateOutcomeRequest = total - value;

    if (validateOutcomeRequest < 0 && type === 'outcome') {
      throw new AppError('The outcome value is bigger than total value');
    }

    const getNewlyCreatedCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: getNewlyCreatedCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
