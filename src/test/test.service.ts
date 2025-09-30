import { Injectable } from '@nestjs/common';
import { TestRepository } from './test.repository';

@Injectable()
export class TestService {
    constructor(
        private readonly testRepo: TestRepository
    ) {}

    async findOneTestWithScience(test_id:string){
        return this.testRepo.findOneTestWithScience(test_id)
    }
}
